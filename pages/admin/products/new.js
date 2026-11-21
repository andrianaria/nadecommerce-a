import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminPageFrame from "@/components/AdminPageFrame";
import ProductForm from "@/components/admin/ProductForm";
import { getAdminSession } from "@/lib/admin-auth";
import { listProductCategories } from "@/lib/category-store";
import { listOutlets } from "@/lib/outlet-store";
import styles from "@/styles/Admin.module.css";

export default function NewProductPage({ admin, categories, outlets }) {
  const router = useRouter();
  const [toast, setToast] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  async function onSubmit(payload) {
    setStatus("Menyimpan produk...");
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (response.status === 413) {
      throw new Error("Ukuran data produk terlalu besar. Coba kurangi jumlah atau ukuran media.");
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Gagal menyimpan produk.");
    }
    return { message: `${data.product.name} berhasil disimpan.` };
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin-login";
  }

  return (
    <AdminPageFrame
      title="Tambah produk"
      intro="Buat produk baru. Setelah tersimpan, kamu bisa kembali ke daftar produk."
      admin={admin}
      toast={toast}
      onCloseToast={() => setToast(null)}
      onLogout={logout}
    >
      <section className={styles.stackGrid}>
        <ProductForm
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
          submitLabel="Simpan produk"
          busyLabel="Menyimpan..."
          setToast={setToast}
          status={status}
          setStatus={setStatus}
        />
      </section>
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
      categories: (await listProductCategories()).map((entry) => entry.name),
      outlets: await listOutlets()
    }
  };
}
