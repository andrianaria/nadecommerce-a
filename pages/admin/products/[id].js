import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminPageFrame from "@/components/AdminPageFrame";
import ProductForm from "@/components/admin/ProductForm";
import { getAdminSession } from "@/lib/admin-auth";
import { listProductCategories } from "@/lib/category-store";
import { listOutlets } from "@/lib/outlet-store";
import { getProducts } from "@/lib/product-store";
import styles from "@/styles/Admin.module.css";

export default function EditProductPage({ admin, product, categories, outlets }) {
  const router = useRouter();
  const [toast, setToast] = useState(null);
  const [status, setStatus] = useState(product ? `Mengedit ${product.name}.` : "Produk tidak ditemukan.");

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  async function onSubmit(payload) {
    setStatus("Memperbarui produk...");
    const response = await fetch(`/api/products/${encodeURIComponent(product.id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (response.status === 413) {
      throw new Error("Ukuran data produk terlalu besar. Coba kurangi jumlah atau ukuran media.");
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Gagal memperbarui produk.");
    }
    return { message: `${data.product.name} berhasil diperbarui.` };
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin-login";
  }

  if (!product) {
    return (
      <AdminPageFrame
        title="Produk tidak ditemukan"
        intro="Produk yang kamu cari tidak ada atau sudah dihapus."
        admin={admin}
        toast={toast}
        onCloseToast={() => setToast(null)}
        onLogout={logout}
      >
        <section className={styles.panelCard}>
          <button type="button" className={styles.primaryButton} onClick={() => router.push("/admin")}>
            Kembali ke daftar produk
          </button>
        </section>
      </AdminPageFrame>
    );
  }

  return (
    <AdminPageFrame
      title="Edit produk"
      intro="Ubah data produk. Simpan untuk menerapkan perubahan."
      admin={admin}
      toast={toast}
      onCloseToast={() => setToast(null)}
      onLogout={logout}
    >
      <section className={styles.stackGrid}>
        <ProductForm
          initialProduct={product}
          categories={categories}
          outlets={outlets}
          onSubmit={async (payload) => {
            const result = await onSubmit(payload);
            setToast({ type: "success", message: result.message });
            setStatus(result.message);
            setTimeout(() => router.push("/admin"), 350);
            return result;
          }}
          onCancel={() => router.push("/admin")}
          submitLabel="Perbarui produk"
          busyLabel="Memperbarui..."
          setToast={setToast}
          status={status}
          setStatus={setStatus}
        />
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

  const products = await getProducts();
  const outlets = await listOutlets();
  const product = products.find((entry) => entry.id === params.id) || null;
  const categoryNames = (await listProductCategories()).map((entry) => entry.name);
  const categories = Array.from(
    new Set([...categoryNames, ...products.map((p) => p.category).filter(Boolean)])
  ).sort((a, b) => a.localeCompare(b));

  return {
    props: {
      admin: {
        email: session.adminProfile.email || session.user.email || "",
        fullName: session.adminProfile.full_name || "",
        role: session.adminProfile.role || "admin"
      },
      product,
      categories,
      outlets
    }
  };
}
