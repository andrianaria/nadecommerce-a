import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminPageFrame from "@/components/AdminPageFrame";
import AdminTable from "@/components/admin/AdminTable";
import { getAdminSession } from "@/lib/admin-auth";
import styles from "@/styles/Admin.module.css";

export default function OutletListPage({ admin }) {
  const [outlets, setOutlets] = useState([]);
  const [status, setStatus] = useState("Memuat outlet...");
  const [toast, setToast] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    active: "all"
  });

  async function loadOutlets() {
    const response = await fetch("/api/admin/outlets");
    const data = await response.json().catch(() => ({}));
    setOutlets(data.outlets || []);
    setStatus("Outlet berhasil disinkronkan.");
  }

  useEffect(() => {
    loadOutlets().catch(() => setStatus("Gagal memuat outlet."));
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const rows = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return outlets.filter((o) => {
      const matchesQuery =
        !query ||
        o.name?.toLowerCase().includes(query) ||
        o.shortLabel?.toLowerCase().includes(query) ||
        o.city?.toLowerCase().includes(query) ||
        o.slug?.toLowerCase().includes(query);
      const matchesActive =
        filters.active === "all" ||
        (filters.active === "active" ? o.isActive !== false : o.isActive === false);
      return matchesQuery && matchesActive;
    });
  }, [filters, outlets]);

  async function removeOutlet(outlet) {
    if (!confirm(`Hapus outlet "${outlet.name}"?`)) return;

    setStatus("Menghapus outlet...");
    try {
      const response = await fetch(`/api/admin/outlets/${outlet.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Gagal menghapus outlet.");
      }
      await loadOutlets();
      setToast({ type: "success", message: "Outlet berhasil dihapus." });
      setStatus("Outlet dihapus.");
    } catch (error) {
      setToast({ type: "error", message: error.message });
      setStatus(error.message);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin-login";
  }

  const columns = [
    { key: "name", label: "Nama", render: (o) => <strong>{o.name}</strong> },
    { key: "city", label: "Kota", render: (o) => [o.city, o.province].filter(Boolean).join(", ") || "-" },
    {
      key: "isActive",
      label: "Aktif",
      render: (o) => (
        <span className={o.isActive ? styles.pillSuccess : styles.pillMuted}>{o.isActive ? "Aktif" : "Nonaktif"}</span>
      )
    },
    { key: "slug", label: "Slug", mono: true, render: (o) => o.slug || "-" },
    {
      key: "coord",
      label: "Koordinat",
      render: (o) => (
        <span className={styles.muted}>
          {(o.latitude ?? "-") + ", " + (o.longitude ?? "-")}
        </span>
      )
    },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (o) => (
        <div className={styles.tableActions}>
          <Link href={`/admin/outlets/${encodeURIComponent(o.id)}`} className={styles.inlineLink}>
            Edit
          </Link>
          <button type="button" className={styles.inlineDanger} onClick={() => removeOutlet(o)}>
            Hapus
          </button>
        </div>
      )
    }
  ];

  return (
    <AdminPageFrame
      title="Outlet"
      intro="Kelola data outlet (alamat dan koordinat) untuk kebutuhan pengiriman/pickup."
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
                placeholder="Nama, kota, atau slug"
              />
            </label>
            <label className={styles.filterField}>
              <span>Status</span>
              <select
                value={filters.active}
                onChange={(e) => setFilters((c) => ({ ...c, active: e.target.value }))}
              >
                <option value="all">Semua</option>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </label>
          </div>

          <Link href="/admin/outlets/new" className={styles.primaryLink}>
            Tambah outlet
          </Link>
        </div>

        <p className={styles.formStatus}>{status}</p>
      </section>

      <AdminTable columns={columns} rows={rows} rowKey={(o) => o.id} emptyText="Belum ada outlet." />
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
      }
    }
  };
}

