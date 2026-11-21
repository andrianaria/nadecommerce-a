import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminPageFrame from "@/components/AdminPageFrame";
import AdminTable from "@/components/admin/AdminTable";
import { getAdminSession } from "@/lib/admin-auth";
import { formatRupiah } from "@/lib/formatters";
import { listOutlets } from "@/lib/outlet-store";
import styles from "@/styles/Admin.module.css";

const paymentStatusLabels = {
  unpaid: "Belum bayar",
  pending: "Menunggu",
  paid: "Dibayar",
  failed: "Gagal",
  expired: "Kedaluwarsa",
  refunded: "Dikembalikan"
};

const orderStatusLabels = {
  pending: "Belum selesai",
  confirmed: "Dikonfirmasi",
  paid: "Dibayar",
  processing: "Diproses",
  completed: "Selesai",
  cancelled: "Dibatalkan"
};

function formatDate(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

function formatSchedule(dateString, timeString) {
  if (!dateString && !timeString) return "-";

  let formattedDate = "-";
  if (dateString) {
    const parsed = new Date(`${dateString}T00:00:00`);
    formattedDate = Number.isNaN(parsed.getTime())
      ? dateString
      : parsed.toLocaleDateString("id-ID", { dateStyle: "medium" });
  }

  return timeString ? `${formattedDate}, ${timeString}` : formattedDate;
}

function formatOutletLabel(value) {
  const raw = String(value || "").trim();
  if (!raw) return "-";

  return raw
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getOutletDisplay(order, outletLookup) {
  const details = order.metadata?.checkoutDetails || {};
  const outletSlug = order.outletSlug || details.outletSlug || "";
  const matchedOutlet = outletLookup[outletSlug];

  if (matchedOutlet?.shortLabel) {
    return matchedOutlet.shortLabel;
  }

  if (matchedOutlet?.name) {
    return matchedOutlet.name;
  }

  return formatOutletLabel(outletSlug);
}

export default function TransactionListPage({ admin, outlets }) {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("Memuat transaksi...");
  const [toast, setToast] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    paymentStatus: "all",
    orderStatus: "all"
  });
  const outletLookup = useMemo(
    () =>
      Object.fromEntries(
        (outlets || []).map((outlet) => [outlet.slug, outlet])
      ),
    [outlets]
  );

  async function loadOrders() {
    const response = await fetch("/api/admin/transactions");
    const data = await response.json().catch(() => ({}));
    setOrders(data.orders || []);
    setStatus("Transaksi berhasil disinkronkan.");
  }

  useEffect(() => {
    loadOrders().catch(() => setStatus("Gagal memuat transaksi."));
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      loadOrders().catch(() => {});
    }, 15000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const rows = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return orders.filter((order) => {
      const details = order.metadata?.checkoutDetails || {};
      const matchesSearch =
        !query ||
        order.reference?.toLowerCase().includes(query) ||
        order.customerName?.toLowerCase().includes(query) ||
        order.customerPhone?.toLowerCase().includes(query) ||
        details.recipientName?.toLowerCase?.().includes(query);
      const matchesPayment =
        filters.paymentStatus === "all" || order.paymentStatus === filters.paymentStatus;
      const matchesOrder =
        filters.orderStatus === "all" ||
        (filters.orderStatus === "open"
          ? order.status !== "completed"
          : filters.orderStatus === "completed"
            ? order.status === "completed"
            : order.status === filters.orderStatus);
      return matchesSearch && matchesPayment && matchesOrder;
    });
  }, [filters, orders]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin-login";
  }

  async function syncPayments() {
    setIsSyncing(true);
    setStatus("Mengecek status pembayaran dari Xendit...");
    try {
      const response = await fetch("/api/admin/transactions/sync", { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Gagal sinkron pembayaran.");
      }
      const updatedCount = (data.results || []).filter((r) => r.updated).length;
      setToast({ tone: "success", message: `Sinkron selesai. ${updatedCount} transaksi ter-update.` });
      await loadOrders();
    } catch (error) {
      setToast({ tone: "danger", message: error.message || "Gagal sinkron pembayaran." });
      setStatus(error.message || "Gagal sinkron pembayaran.");
    } finally {
      setIsSyncing(false);
    }
  }

  async function purgeAll() {
    const typed = window.prompt('Ini akan menghapus SEMUA transaksi. Ketik "HAPUS SEMUA" untuk lanjut:');
    if (!typed) return;

    setStatus("Menghapus semua transaksi...");
    try {
      const response = await fetch("/api/admin/transactions/purge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: typed })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Gagal menghapus transaksi.");
      }
      setToast({ tone: "success", message: "Semua transaksi berhasil dihapus." });
      await loadOrders();
    } catch (error) {
      setToast({ tone: "danger", message: error.message || "Gagal menghapus transaksi." });
      setStatus(error.message || "Gagal menghapus transaksi.");
    }
  }

  const columns = [
    { key: "reference", label: "Referensi", mono: true, render: (o) => <strong>{o.reference}</strong> },
    { key: "createdAt", label: "Tanggal", render: (o) => formatDate(o.createdAt) },
    {
      key: "schedule",
      label: "Jadwal",
      render: (o) => {
        const details = o.metadata?.checkoutDetails || {};
        return (
          <div>
            <div>{formatSchedule(details.deliveryDate, details.deliveryTime)}</div>
            <div className={styles.muted}>
              {o.fulfillmentType === "pickup" ? "Pickup" : "Delivery"}
            </div>
          </div>
        );
      }
    },
    {
      key: "customer",
      label: "Pemesan",
      render: (o) => (
        <div>
          <div>{o.customerName || "-"}</div>
          <div className={styles.muted}>{o.customerPhone || "-"}</div>
        </div>
      )
    },
    {
      key: "outlet",
      label: "Outlet",
      render: (o) => getOutletDisplay(o, outletLookup)
    },
    {
      key: "total",
      label: "Total",
      align: "right",
      render: (o) => formatRupiah(o.total || 0)
    },
    {
      key: "status",
      label: "Status pesanan",
      render: (o) => (
        <span className={o.status === "completed" ? styles.pillSuccess : styles.pillMuted}>
          {orderStatusLabels[o.status] || o.status || "-"}
        </span>
      )
    },
    {
      key: "paymentStatus",
      label: "Pembayaran",
      render: (o) => (
        <span className={o.paymentStatus === "paid" ? styles.pillSuccess : styles.pillWarning}>
          {paymentStatusLabels[o.paymentStatus] || o.paymentStatus || "-"}
        </span>
      )
    },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (o) => (
        <Link href={`/admin/transactions/${encodeURIComponent(o.reference)}`} className={styles.inlineLink}>
          Detail
        </Link>
      )
    }
  ];

  return (
    <AdminPageFrame
      title="Transaksi"
      intro="Daftar transaksi dalam bentuk tabel. Klik detail untuk melihat item, alamat, dan update status."
      admin={admin}
      toast={toast}
      onCloseToast={() => setToast(null)}
      onLogout={logout}
    >
      <section className={styles.panelCard}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarGroup}>
            <label className={styles.filterField}>
              <span>Cari</span>
              <input
                value={filters.search}
                onChange={(e) => setFilters((c) => ({ ...c, search: e.target.value }))}
                placeholder="Referensi, nama, nomor, penerima"
              />
            </label>
            <label className={styles.filterField}>
              <span>Status pembayaran</span>
              <select
                value={filters.paymentStatus}
                onChange={(e) => setFilters((c) => ({ ...c, paymentStatus: e.target.value }))}
              >
                <option value="all">Semua</option>
                {Object.keys(paymentStatusLabels).map((statusKey) => (
                  <option key={statusKey} value={statusKey}>
                    {paymentStatusLabels[statusKey]}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.filterField}>
              <span>Status pesanan</span>
              <select
                value={filters.orderStatus}
                onChange={(e) => setFilters((c) => ({ ...c, orderStatus: e.target.value }))}
              >
                <option value="all">Semua</option>
                <option value="open">Belum selesai</option>
                <option value="completed">Selesai</option>
                {Object.keys(orderStatusLabels).map((statusKey) => (
                  <option key={statusKey} value={statusKey}>
                    {orderStatusLabels[statusKey]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className={styles.toolbarActions}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={syncPayments}
              disabled={isSyncing}
            >
              {isSyncing ? "Menyinkron..." : "Sinkron pembayaran"}
            </button>
            <button
              type="button"
              className={styles.dangerButton}
              onClick={purgeAll}
              title="Hapus semua transaksi (khusus testing)"
            >
              Hapus semua
            </button>
          </div>
        </div>

        <p className={styles.formStatus}>{status}</p>
      </section>

      <AdminTable columns={columns} rows={rows} rowKey={(o) => o.reference} emptyText="Belum ada transaksi." />
    </AdminPageFrame>
  );
}

export async function getServerSideProps({ req }) {
  const session = await getAdminSession(req);
  if (!session) {
    return {
      redirect: {
        destination: "/admin-login",
        permanent: false
      }
    };
  }

  return {
    props: {
      admin: {
        email: session.adminProfile.email || session.user.email || "",
        fullName: session.adminProfile.full_name || "",
        role: session.adminProfile.role || "admin"
      },
      outlets: await listOutlets()
    }
  };
}
