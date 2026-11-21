import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminPageFrame from "@/components/AdminPageFrame";
import AdminTable from "@/components/admin/AdminTable";
import { getAdminSession } from "@/lib/admin-auth";
import { listProductCategories } from "@/lib/category-store";
import { formatRupiah } from "@/lib/formatters";
import { getProducts } from "@/lib/product-store";
import styles from "@/styles/Admin.module.css";

export default function ProductListPage({ admin, initialCategories = [], initialProducts = [] }) {
  const [products, setProducts] = useState(initialProducts);
  const [status, setStatus] = useState("Memuat produk...");
  const [toast, setToast] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    category: "all"
  });

  async function loadProducts() {
    const response = await fetch("/api/products");
    const data = await response.json().catch(() => ({}));
    setProducts(data.products || []);
    setStatus("Produk berhasil disinkronkan.");
  }

  useEffect(() => {
    loadProducts().catch(() => setStatus("Gagal memuat produk."));
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const categories = useMemo(() => {
    const values = new Set([...initialCategories, ...products.map((p) => p.category).filter(Boolean)]);
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [initialCategories, products]);

  const rows = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesQuery =
        !query ||
        p.name?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        p.id?.toLowerCase?.().includes(query);
      const matchesCategory = filters.category === "all" || p.category === filters.category;
      return matchesQuery && matchesCategory;
    });
  }, [filters, products]);

  async function removeProduct(product) {
    if (!confirm(`Hapus produk "${product.name}"?`)) return;

    setStatus("Menghapus produk...");
    try {
      const response = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Gagal menghapus produk.");
      }
      await loadProducts();
      setToast({ type: "success", message: "Produk berhasil dihapus." });
      setStatus("Produk dihapus.");
    } catch (error) {
      setToast({ type: "error", message: error.message });
      setStatus(error.message);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin-login";
  }

  const totalProducts = products.length;
  const highlightCount = products.filter((p) => p.featured).length;
  const spotlightCount = products.filter((p) => p.spotlight).length;
  const categoryCount = categories.length;

  function StatIcon({ name }) {
    if (name === "star") {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 17.3l-6.2 3.4 1.2-7.1L1.8 8.8l7.2-1L12 1.4l3 6.4 7.2 1-5.2 4.8 1.2 7.1L12 17.3z" />
        </svg>
      );
    }

    if (name === "tag") {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20.6 13.2l-7.4 7.4-11-11V2.6h7.6l11 11z" />
          <path d="M7.5 7.5h.01" />
        </svg>
      );
    }

    // box
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 8l-9-5-9 5 9 5 9-5z" />
        <path d="M3 8v8l9 5 9-5V8" />
        <path d="M12 13v8" />
      </svg>
    );
  }

  const primaryAction = (
    <Link href="/admin/products/new" className={styles.primaryLink}>
      Tambah produk
    </Link>
  );

  const columns = [
    {
      key: "cover",
      label: "Cover",
      render: (p) =>
        p.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.coverImageUrl} alt={p.name} className={styles.tableThumb} />
        ) : (
          <span className={styles.muted}>-</span>
        )
    },
    { key: "name", label: "Nama", render: (p) => <strong>{p.name}</strong> },
    { key: "category", label: "Kategori", render: (p) => p.category || "-" },
    {
      key: "price",
      label: "Harga",
      align: "right",
      render: (p) => formatRupiah(p.price || 0)
    },
    {
      key: "flags",
      label: "Status",
      render: (p) => (
        <div className={styles.pillRow}>
          {p.featured ? <span className={styles.pillSuccess}>Highlight</span> : null}
          {p.spotlight ? <span className={styles.pillWarning}>Spotlight</span> : null}
        </div>
      )
    },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (p) => (
        <div className={styles.tableActions}>
          <Link href={`/admin/products/${encodeURIComponent(p.id)}`} className={styles.inlineLink}>
            Edit
          </Link>
          <button type="button" className={styles.inlineDanger} onClick={() => removeProduct(p)}>
            Hapus
          </button>
        </div>
      )
    }
  ];

  return (
    <AdminPageFrame
      title="Produk"
      intro="Kelola daftar produk. Untuk menambah atau mengubah data, buka halaman khusus produk."
      admin={admin}
      toast={toast}
      onCloseToast={() => setToast(null)}
      onLogout={logout}
      primaryAction={primaryAction}
    >
      <section className={styles.statRow}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <StatIcon name="box" />
          </div>
          <div>
            <div className={styles.statLabel}>Total produk</div>
            <div className={styles.statValue}>{totalProducts}</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <StatIcon name="star" />
          </div>
          <div>
            <div className={styles.statLabel}>Highlight</div>
            <div className={styles.statValue}>{highlightCount}</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <StatIcon name="star" />
          </div>
          <div>
            <div className={styles.statLabel}>Spotlight</div>
            <div className={styles.statValue}>{spotlightCount}</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <StatIcon name="tag" />
          </div>
          <div>
            <div className={styles.statLabel}>Kategori</div>
            <div className={styles.statValue}>{categoryCount}</div>
          </div>
        </div>
      </section>

      <section className={styles.panelCard}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarGroup}>
            <label className={styles.filterField}>
              <span>Cari</span>
              <input
                value={filters.search}
                onChange={(e) => setFilters((c) => ({ ...c, search: e.target.value }))}
                placeholder="Nama atau kategori"
              />
            </label>
            <label className={styles.filterField}>
              <span>Kategori</span>
              <select
                value={filters.category}
                onChange={(e) => setFilters((c) => ({ ...c, category: e.target.value }))}
              >
                <option value="all">Semua</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <p className={styles.formStatus}>{status}</p>
      </section>

      <AdminTable
        columns={columns}
        rows={rows}
        rowKey={(p) => p.id}
        emptyText="Belum ada produk."
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
      initialCategories: (await listProductCategories()).map((entry) => entry.name),
      initialProducts: await getProducts()
    }
  };
}
