import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import AdminPageFrame from "@/components/AdminPageFrame";
import { getAdminSession } from "@/lib/admin-auth";
import { findOrderByReference } from "@/lib/order-store";
import { formatRupiah } from "@/lib/formatters";
import styles from "@/styles/Admin.module.css";

const orderStatuses = [
  { value: "pending", label: "Menunggu" },
  { value: "confirmed", label: "Dikonfirmasi" },
  { value: "paid", label: "Dibayar" },
  { value: "processing", label: "Diproses" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" }
];
const orderStatusLabels = Object.fromEntries(orderStatuses.map((item) => [item.value, item.label]));

const paymentStatuses = [
  { value: "unpaid", label: "Belum bayar" },
  { value: "pending", label: "Menunggu" },
  { value: "paid", label: "Dibayar" },
  { value: "failed", label: "Gagal" },
  { value: "expired", label: "Kedaluwarsa" },
  { value: "refunded", label: "Dikembalikan" }
];
const paymentStatusLabels = Object.fromEntries(paymentStatuses.map((item) => [item.value, item.label]));

const deliveryStatuses = [
  { value: "pending", label: "Menunggu" },
  { value: "quoted", label: "Estimasi dibuat" },
  { value: "booked", label: "Dipesan" },
  { value: "picked_up", label: "Diambil kurir" },
  { value: "delivered", label: "Terkirim" },
  { value: "cancelled", label: "Dibatalkan" }
];
const deliveryStatusLabels = {
  pending: "Menunggu",
  quoted: "Estimasi dibuat",
  booked: "Dipesan",
  assigning_driver: "Mencari kurir",
  assigned: "Kurir ditugaskan",
  on_going_pickup: "Kurir menuju outlet",
  picked_up: "Diambil kurir",
  on_going_dropoff: "Dalam perjalanan",
  delivered: "Terkirim",
  cancelled: "Dibatalkan"
};

function formatDate(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

function formatOutletLabel(value) {
  return String(value || "-")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildFullDeliveryAddress(baseAddress, detailAddress) {
  const base = String(baseAddress || "").trim();
  const detail = String(detailAddress || "").trim();

  if (!base) return detail || "-";
  if (!detail) return base;

  const normalizedBase = base.toLowerCase();
  const normalizedDetail = detail.toLowerCase();

  if (normalizedBase.includes(normalizedDetail)) return base;
  if (normalizedDetail.includes(normalizedBase)) return detail;

  return `${detail}, ${base}`;
}

function extractOrderNotes(addressContext, ...entries) {
  const seen = new Set();
  const notes = [];
  const addressHaystacks = [addressContext]
    .flat()
    .map((entry) => String(entry || "").trim().toLowerCase())
    .filter(Boolean);

  entries
    .flatMap((entry) => String(entry || "").split(/\r?\n+/))
    .map((entry) => entry.trim())
    .filter(Boolean)
    .forEach((entry) => {
      const normalized = entry.toLowerCase();
      if (
        normalized.startsWith("detail alamat lengkap:") ||
        normalized.startsWith("full address details:")
      ) {
        return;
      }

      if (addressHaystacks.some((address) => address.includes(normalized))) {
        return;
      }

      if (seen.has(normalized)) return;
      seen.add(normalized);
      notes.push(entry);
    });

  return notes;
}

function getBadgeClass(kind, value) {
  const text = String(value || "").toLowerCase();
  if (
    text === "completed" ||
    text === "paid" ||
    text === "delivered" ||
    text === "dibayar" ||
    text === "selesai" ||
    text === "terkirim"
  ) {
    return styles.pillSuccess;
  }

  if (
    text === "cancelled" ||
    text === "failed" ||
    text === "expired" ||
    text === "refunded" ||
    text === "dibatalkan" ||
    text === "gagal" ||
    text === "kedaluwarsa"
  ) {
    return styles.pillDanger;
  }

  if (
    kind === "order" &&
    (text === "processing" || text === "confirmed" || text === "diproses" || text === "dikonfirmasi")
  ) {
    return styles.pillPrimary;
  }

  return styles.pillWarning;
}

export default function TransactionDetailPage({ admin, order }) {
  const router = useRouter();
  const [toast, setToast] = useState(null);
  const [status, setStatus] = useState(order ? "" : "Transaksi tidak ditemukan.");
  const [draft, setDraft] = useState(() => ({
    status: order?.status || "pending",
    paymentStatus: order?.paymentStatus || "unpaid",
    deliveryStatus: order?.deliveryStatus || "pending"
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingDelivery, setIsSyncingDelivery] = useState(false);
  const hasAutoSynced = useRef(false);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    setDraft({
      status: order?.status || "pending",
      paymentStatus: order?.paymentStatus || "unpaid",
      deliveryStatus: order?.deliveryStatus || "pending"
    });
  }, [order?.status, order?.paymentStatus, order?.deliveryStatus]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin-login";
  }

  async function save() {
    setIsSaving(true);
    setStatus("Menyimpan perubahan...");

    try {
      const response = await fetch(`/api/admin/transactions/${encodeURIComponent(order.reference)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: draft.status,
          paymentStatus: draft.paymentStatus,
          deliveryStatus: draft.deliveryStatus
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Gagal menyimpan perubahan.");
      }

      if (data.order) {
        setDraft({
          status: data.order.status || "pending",
          paymentStatus: data.order.paymentStatus || "unpaid",
          deliveryStatus: data.order.deliveryStatus || "pending"
        });
      }
      setToast({ type: "success", message: "Perubahan berhasil disimpan." });
      setStatus("Perubahan tersimpan.");
      router.replace(router.asPath);
    } catch (error) {
      setToast({ type: "error", message: error.message });
      setStatus(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function syncPayment() {
    if (!order?.reference) return;
    setIsSyncing(true);
    setStatus("Mengecek status pembayaran dari Xendit...");

    try {
      const response = await fetch("/api/admin/transactions/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: order.reference })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Gagal sinkron pembayaran.");
      }

      const result = Array.isArray(data.results) ? data.results[0] : null;
      if (result?.ok) {
        setToast({
          type: "success",
          message: result.updated
            ? "Status pembayaran berhasil diperbarui."
            : "Status pembayaran sudah paling baru."
        });
        setStatus("Sinkron selesai.");
        // Reload SSR data so the dropdowns + paidAt reflect the latest DB state.
        router.replace(router.asPath);
        return;
      }

      throw new Error(result?.error || "Gagal sinkron pembayaran.");
    } catch (error) {
      setToast({ type: "error", message: error.message });
      setStatus(error.message);
    } finally {
      setIsSyncing(false);
    }
  }

  async function createDelivery() {
    if (!order?.reference) return;
    setIsSyncing(true);
    setStatus("Membuat pengiriman Lalamove...");

    try {
      const response = await fetch("/api/admin/transactions/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: order.reference })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Gagal membuat pengiriman.");
      }

      setToast({ type: "success", message: "Pengiriman berhasil dibuat di Lalamove." });
      setStatus("Pengiriman dibuat.");
      router.replace(router.asPath);
    } catch (error) {
      setToast({ type: "error", message: error.message });
      setStatus(error.message);
    } finally {
      setIsSyncing(false);
    }
  }

  async function syncLalamoveStatus() {
    if (!order?.reference) return;
    setIsSyncingDelivery(true);
    setStatus("Menyinkronkan status Lalamove...");

    try {
      const response = await fetch("/api/admin/transactions/lalamove-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: order.reference })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Gagal sinkron status Lalamove.");
      }

      setToast({ type: "success", message: "Status Lalamove berhasil disinkronkan." });
      setStatus("Status Lalamove berhasil diperbarui.");
      router.replace(router.asPath);
    } catch (error) {
      setToast({ type: "error", message: error.message });
      setStatus(error.message);
    } finally {
      setIsSyncingDelivery(false);
    }
  }

  if (!order) {
    return (
      <AdminPageFrame
        title="Detail transaksi"
        intro="Transaksi tidak ditemukan."
        admin={admin}
        toast={toast}
        onCloseToast={() => setToast(null)}
        onLogout={logout}
      >
        <section className={styles.panelCard}>
          <button type="button" className={styles.primaryButton} onClick={() => router.push("/admin/transactions")}>
            Kembali ke daftar transaksi
          </button>
        </section>
      </AdminPageFrame>
    );
  }

  const details = order.metadata?.checkoutDetails || {};
  const lalamoveOrder = order.metadata?.lalamove?.order?.data || order.metadata?.lalamove?.order || null;
  const lalamoveQuote = order.metadata?.lalamove?.quotation?.data || order.metadata?.lalamove?.quotation || null;
  const resolvedDeliveryStatus = String(
    order.deliveryStatus || lalamoveOrder?.status || order.metadata?.lalamove?.webhook?.status || "pending"
  ).toLowerCase();
  const isDeliveryRetryable = ["cancelled", "canceled", "failed"].includes(resolvedDeliveryStatus);
  const isDeliveryCompleted = ["delivered", "completed"].includes(resolvedDeliveryStatus);
  const canSyncPayment =
    order.paymentProvider === "xendit" &&
    Boolean(order.paymentReference) &&
    String(order.paymentStatus || "unpaid") !== "paid";
  const canCreateDelivery =
    order.fulfillmentType === "delivery" &&
    String(order.paymentStatus || "").toLowerCase() === "paid" &&
    !isDeliveryCompleted &&
    (!order.deliveryReference || String(order.deliveryReference) === "" || isDeliveryRetryable);
  const canSyncLalamove =
    order.fulfillmentType === "delivery" &&
    Boolean(order.deliveryReference || lalamoveOrder?.orderId);

  const orderStatusLabel = orderStatusLabels[order.status] || order.status || "-";
  const paymentStatusLabel = paymentStatusLabels[order.paymentStatus] || order.paymentStatus || "-";
  const deliveryStatusLabel =
    deliveryStatusLabels[resolvedDeliveryStatus] ||
    order.deliveryStatus ||
    lalamoveOrder?.status ||
    "-";
  const recipientAddress = buildFullDeliveryAddress(details.deliveryAddress, details.deliveryAddressDetail);
  const orderNotes = extractOrderNotes(
    [recipientAddress, details.deliveryAddress, details.deliveryAddressDetail],
    details.otherNote,
    order.notes
  );

  useEffect(() => {
    if (!canSyncPayment) return;
    if (hasAutoSynced.current) return;
    hasAutoSynced.current = true;
    syncPayment().catch(() => {});
  }, [canSyncPayment]);

  return (
    <AdminPageFrame
      title="Detail transaksi"
      intro="Lihat detail pesanan dan ubah status jika diperlukan."
      admin={admin}
      toast={toast}
      onCloseToast={() => setToast(null)}
      onLogout={logout}
    >
      <section className={styles.stackGrid}>
        <section className={styles.panelCard}>
          <div className={styles.detailHeader}>
            <div>
              <h2 className={styles.detailTitle}>{order.reference}</h2>
              <p className={styles.muted}>
                Dibuat {formatDate(order.createdAt)} • Dibayar {formatDate(order.paidAt)}
              </p>
              <div className={styles.pillRow} style={{ marginTop: 12 }}>
                <span className={getBadgeClass("order", order.status)}>{orderStatusLabel}</span>
                <span className={getBadgeClass("payment", order.paymentStatus)}>{paymentStatusLabel}</span>
                <span className={getBadgeClass("delivery", order.deliveryStatus)}>{deliveryStatusLabel}</span>
              </div>
            </div>
            <div className={styles.detailHeaderActions}>
              {canSyncPayment ? (
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={syncPayment}
                  disabled={isSyncing}
                >
                  {isSyncing ? "Menyinkron..." : "Sinkron pembayaran"}
                </button>
              ) : null}
              {canCreateDelivery ? (
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={createDelivery}
                  disabled={isSyncing}
                >
                  Buat pengiriman
                </button>
              ) : null}
              {canSyncLalamove ? (
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={syncLalamoveStatus}
                  disabled={isSyncingDelivery}
                >
                  {isSyncingDelivery ? "Menyinkron..." : "Sinkron status Lalamove"}
                </button>
              ) : null}
              <button type="button" className={styles.secondaryButton} onClick={() => router.push("/admin/transactions")}>
                Kembali
              </button>
            </div>
          </div>
          {status ? <p className={styles.formStatus}>{status}</p> : null}
        </section>

        <section className={styles.panelCard}>
          <div className={styles.detailInfoBlock}>
            <div className={styles.detailSectionCard}>
              <h3>Outlet pesanan</h3>
              <div className={styles.kvGrid}>
                <div className={styles.kv}>
                  <span>Outlet</span>
                  <strong>{formatOutletLabel(order.outletSlug || details.outletSlug || "-")}</strong>
                </div>
                <div className={styles.kv}>
                  <span>Total</span>
                  <strong>{formatRupiah(order.total || 0)}</strong>
                </div>
                <div className={styles.kv}>
                  <span>Tipe pesanan</span>
                  <strong>{order.fulfillmentType === "pickup" ? "Pickup" : "Delivery"}</strong>
                </div>
              </div>
            </div>

            <div className={styles.detailSectionCard}>
              <h3>Data pemesan</h3>
              <div className={styles.kvGrid}>
                <div className={styles.kv}>
                  <span>Nama pemesan</span>
                  <strong>{order.customerName || "-"}</strong>
                </div>
                <div className={styles.kv}>
                  <span>Nomor pemesan</span>
                  <strong>{order.customerPhone || "-"}</strong>
                </div>
                {order.customerEmail ? (
                  <div className={styles.kvWide}>
                    <span>Email pemesan</span>
                    <strong>{order.customerEmail}</strong>
                  </div>
                ) : null}
              </div>
            </div>

            <div className={styles.detailSectionCard}>
              <h3>Data penerima</h3>
              <div className={styles.kvGrid}>
                <div className={styles.kv}>
                  <span>Nama penerima</span>
                  <strong>{details.recipientName || order.customerName || "-"}</strong>
                </div>
                <div className={styles.kv}>
                  <span>Nomor penerima</span>
                  <strong>{details.recipientPhone || "-"}</strong>
                </div>
                {recipientAddress && recipientAddress !== "-" ? (
                  <div className={styles.kvWide}>
                    <span>Alamat kirim</span>
                    <strong>{recipientAddress}</strong>
                  </div>
                ) : null}
              </div>
            </div>

            <div className={styles.detailSectionCard}>
              <h3>Jam kirim</h3>
              <div className={styles.kvGrid}>
                <div className={styles.kv}>
                  <span>Tanggal kirim</span>
                  <strong>{details.deliveryDate || "-"}</strong>
                </div>
                <div className={styles.kv}>
                  <span>Jam kirim</span>
                  <strong>{details.deliveryTime || "-"}</strong>
                </div>
              </div>
            </div>

            <div className={styles.detailSectionCard}>
              <h3>Detail pesanan</h3>
              <div className={styles.tableScroll}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Nama</th>
                      <th className={styles.thRight}>Qty</th>
                      <th className={styles.thRight}>Harga</th>
                      <th className={styles.thRight}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.items || []).map((item) => (
                      <tr key={`${order.reference}-${item.productId}-${item.name}`}>
                        <td>
                          <div className={styles.itemCellStack}>
                            <strong>{item.name}</strong>
                            {item.note ? <span className={styles.itemInlineNote}>{item.note}</span> : null}
                          </div>
                        </td>
                        <td className={styles.tdRight}>{item.quantity}</td>
                        <td className={styles.tdRight}>{formatRupiah(item.price || 0)}</td>
                        <td className={styles.tdRight}>{formatRupiah(item.lineTotal || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles.detailSectionCard}>
              <h3>Note pesanan</h3>
              {orderNotes.length ? (
                <div className={styles.noteList}>
                  {orderNotes.map((note, index) => (
                    <div key={`${note}-${index}`} className={styles.noteItem}>
                      {note}
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.muted}>Tidak ada note pesanan.</p>
              )}
            </div>
          </div>
        </section>

        <section className={styles.panelCard}>
          <h3>Pengiriman (Lalamove)</h3>
          <div className={styles.kvGrid}>
            <div className={styles.kv}>
              <span>Status pengiriman</span>
              <strong>{deliveryStatusLabel}</strong>
            </div>
            <div className={styles.kv}>
              <span>Quotation ID</span>
              <strong>{order.deliveryQuoteId || lalamoveQuote?.quotationId || "-"}</strong>
            </div>
            <div className={styles.kv}>
              <span>Order ID</span>
              <strong>{order.deliveryReference || lalamoveOrder?.orderId || "-"}</strong>
            </div>
            {lalamoveOrder?.shareLink ? (
              <div className={styles.kvWide}>
                <span>Share link</span>
                <strong>
                  <a href={lalamoveOrder.shareLink} target="_blank" rel="noreferrer" className={styles.inlineLink}>
                    Buka tracking link
                  </a>
                </strong>
              </div>
            ) : null}
          </div>
        </section>

        <section className={styles.panelCard}>
          <h3>Status</h3>
          <div className={styles.statusGrid}>
            <label className={styles.filterField}>
              <span>Status pesanan</span>
              <select value={draft.status} onChange={(e) => setDraft((c) => ({ ...c, status: e.target.value }))}>
                {orderStatuses.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.filterField}>
              <span>Status pembayaran</span>
              <select
                value={draft.paymentStatus}
                onChange={(e) => setDraft((c) => ({ ...c, paymentStatus: e.target.value }))}
              >
                {paymentStatuses.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.filterField}>
              <span>Status pengiriman</span>
              <select
                value={draft.deliveryStatus}
                onChange={(e) => setDraft((c) => ({ ...c, deliveryStatus: e.target.value }))}
              >
                {deliveryStatuses.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.formFooter}>
            <button type="button" className={styles.secondaryButton} onClick={() => router.push("/admin/transactions")}>
              Kembali
            </button>
            <button type="button" onClick={save} disabled={isSaving}>
              {isSaving ? "Menyimpan..." : "Simpan perubahan"}
            </button>
          </div>
        </section>
      </section>
    </AdminPageFrame>
  );
}

export async function getServerSideProps({ req, params }) {
  const session = await getAdminSession(req);
  if (!session) {
    return {
      redirect: {
        destination: "/admin-login",
        permanent: false
      }
    };
  }

  const order = await findOrderByReference(params.reference);

  return {
    props: {
      admin: {
        email: session.adminProfile.email || session.user.email || "",
        fullName: session.adminProfile.full_name || "",
        role: session.adminProfile.role || "admin"
      },
      order
    }
  };
}
