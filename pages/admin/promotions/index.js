import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminPageFrame from "@/components/AdminPageFrame";
import AdminTable from "@/components/admin/AdminTable";
import { getAdminSession } from "@/lib/admin-auth";
import { getProducts } from "@/lib/product-store";
import { listOutlets } from "@/lib/outlet-store";
import styles from "@/styles/Admin.module.css";

function formatDiscount(promotion) {
  if (promotion.discountType === "percentage") {
    return `${promotion.discountValue}%`;
  }
  return `Rp ${Number(promotion.discountValue || 0).toLocaleString("id-ID")}`;
}

function formatScope(scope) {
  if (scope === "member") return "Member";
  if (scope === "first_order_member") return "Member pesanan pertama";
  return "Semua customer";
}

export default function PromotionListPage({ admin, productsById, outletsBySlug }) {
  const [promotions, setPromotions] = useState([]);
  const [status, setStatus] = useState("Memuat promosi...");
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");

  async function loadPromotions() {
    const response = await fetch("/api/admin/promotions");
    const data = await response.json().catch(() => ({}));
    setPromotions(data.promotions || []);
    setStatus("Promosi berhasil dimuat.");
  }

  useEffect(() => {
    loadPromotions().catch(() => setStatus("Gagal memuat promosi."));
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  async function removePromotion(promotion) {
    if (!confirm(`Hapus promosi "${promotion.name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/promotions/${promotion.id}`, {
        method: "DELETE"
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Gagal menghapus promosi.");
      }
      await loadPromotions();
      setToast({ type: "success", message: "Promosi berhasil dihapus." });
    } catch (error) {
      setToast({ type: "error", message: error.message });
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin-login";
  }

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return promotions.filter((promotion) => {
      if (!needle) return true;
      return [promotion.name, promotion.code, promotion.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [promotions, search]);

  const columns = [
    { key: "name", label: "Promosi", render: (p) => <strong>{p.name}</strong> },
    { key: "code", label: "Kode", render: (p) => p.code || <span className={styles.muted}>Auto</span> },
    { key: "discount", label: "Diskon", render: (p) => formatDiscount(p) },
    { key: "scope", label: "Target", render: (p) => formatScope(p.eligibilityScope) },
    {
      key: "products",
      label: "Produk",
      render: (p) =>
        p.productSlugs?.length
          ? p.productSlugs.map((slug) => productsById[slug]?.name || slug).join(", ")
          : "Semua"
    },
    {
      key: "outlets",
      label: "Outlet",
      render: (p) =>
        p.outletSlugs?.length
          ? p.outletSlugs.map((slug) => outletsBySlug[slug]?.shortLabel || slug).join(", ")
          : "Semua"
    },
    {
      key: "status",
      label: "Status",
      render: (p) => (
        <div className={styles.pillRow}>
          {p.isActive ? <span className={styles.pillSuccess}>Aktif</span> : <span className={styles.pillMuted}>Nonaktif</span>}
          {p.autoApply ? <span className={styles.pillWarning}>Auto</span> : null}
        </div>
      )
    },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (p) => (
        <div className={styles.tableActions}>
          <Link href={`/admin/promotions/${p.id}`} className={styles.inlineLink}>
            Edit
          </Link>
          <button type="button" className={styles.inlineDanger} onClick={() => removePromotion(p)}>
            Hapus
          </button>
        </div>
      )
    }
  ];

  return (
    <AdminPageFrame
      title="Promosi"
      intro="Buat promosi custom untuk produk, member, atau pesanan pertama member."
      admin={admin}
      toast={toast}
      onCloseToast={() => setToast(null)}
      onLogout={logout}
      primaryAction={
        <Link href="/admin/promotions/new" className={styles.primaryLink}>
          Tambah promosi
        </Link>
      }
    >
      <section className={styles.panelCard}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarGroup}>
            <label className={styles.filterField}>
              <span>Cari</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nama promo, kode, atau deskripsi"
              />
            </label>
          </div>
        </div>
        <p className={styles.formStatus}>{status}</p>
      </section>

      <AdminTable
        columns={columns}
        rows={rows}
        rowKey={(promotion) => promotion.id}
        emptyText="Belum ada promosi."
      />
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

  const products = await getProducts();
  const outlets = await listOutlets();

  return {
    props: {
      admin: {
        email: session.adminProfile.email || session.user.email || "",
        fullName: session.adminProfile.full_name || "",
        role: session.adminProfile.role || "admin"
      },
      productsById: Object.fromEntries(products.map((product) => [product.id, product])),
      outletsBySlug: Object.fromEntries(outlets.map((outlet) => [outlet.slug, outlet]))
    }
  };
}
