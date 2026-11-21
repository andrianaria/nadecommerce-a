import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminPageFrame from "@/components/AdminPageFrame";
import AdminTable from "@/components/admin/AdminTable";
import { getAdminSession } from "@/lib/admin-auth";
import { listProductCategories } from "@/lib/category-store";
import { getProducts } from "@/lib/product-store";
import styles from "@/styles/Admin.module.css";

export default function CategoryListPage({ admin, initialCategories = [], initialProducts = [] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [products] = useState(initialProducts);
  const [status, setStatus] = useState("Kategori berhasil dimuat.");
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const usageByCategory = useMemo(() => {
    const map = new Map();
    for (const product of products) {
      const key = String(product.category || "").trim().toLowerCase();
      if (!key) continue;
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [products]);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return categories.filter((category) => {
      if (!query) return true;
      return (
        category.name.toLowerCase().includes(query) ||
        category.slug.toLowerCase().includes(query)
      );
    });
  }, [categories, search]);

  async function removeCategory(category) {
    if (!confirm(`Hapus kategori "${category.name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/categories/${encodeURIComponent(category.id)}`, {
        method: "DELETE"
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Gagal menghapus kategori.");
      }
      setCategories((current) => current.filter((entry) => entry.id !== category.id));
      setStatus("Kategori berhasil dihapus.");
      setToast({ type: "success", message: "Kategori berhasil dihapus." });
    } catch (error) {
      setStatus(error.message);
      setToast({ type: "error", message: error.message });
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin-login";
  }

  const columns = [
    { key: "name", label: "Nama kategori", render: (row) => <strong>{row.name}</strong> },
    { key: "slug", label: "Slug", mono: true, render: (row) => row.slug },
    {
      key: "usage",
      label: "Dipakai produk",
      align: "right",
      render: (row) => usageByCategory.get(row.name.toLowerCase()) || 0
    },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (row) => (
        <div className={styles.tableActions}>
          <button type="button" className={styles.inlineDanger} onClick={() => removeCategory(row)}>
            Hapus
          </button>
        </div>
      )
    }
  ];

  return (
    <AdminPageFrame
      title="Kategori produk"
      intro="Kelola kategori produk agar form produk tetap rapi dan terstruktur."
      admin={admin}
      toast={toast}
      onCloseToast={() => setToast(null)}
      onLogout={logout}
      primaryAction={
        <Link href="/admin/categories/new" className={styles.primaryLink}>
          Tambah kategori
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
                placeholder="Nama atau slug kategori"
              />
            </label>
          </div>
        </div>
        <p className={styles.formStatus}>{status}</p>
      </section>

      <AdminTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        emptyText="Belum ada kategori."
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

  return {
    props: {
      admin: {
        email: session.adminProfile.email || session.user.email || "",
        fullName: session.adminProfile.full_name || "",
        role: session.adminProfile.role || "admin"
      },
      initialCategories: await listProductCategories(),
      initialProducts: await getProducts()
    }
  };
}
