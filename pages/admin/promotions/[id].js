import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminPageFrame from "@/components/AdminPageFrame";
import PromotionForm from "@/components/admin/PromotionForm";
import { getAdminSession } from "@/lib/admin-auth";
import { findPromotionById } from "@/lib/promotion-store";
import { getProducts } from "@/lib/product-store";
import { listOutlets } from "@/lib/outlet-store";
import styles from "@/styles/Admin.module.css";

export default function EditPromotionPage({ admin, promotion, products, outlets }) {
  const router = useRouter();
  const [toast, setToast] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  async function onSubmit(payload) {
    setStatus("Menyimpan promosi...");
    const response = await fetch(`/api/admin/promotions/${promotion.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Gagal menyimpan promosi.");
    }
    return { message: `${data.promotion.name} berhasil diperbarui.` };
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin-login";
  }

  return (
    <AdminPageFrame
      title="Edit promosi"
      intro="Sesuaikan rule promo dan langsung gunakan di checkout."
      admin={admin}
      toast={toast}
      onCloseToast={() => setToast(null)}
      onLogout={logout}
    >
      <section className={styles.stackGrid}>
        <PromotionForm
          initialPromotion={promotion}
          products={products}
          outlets={outlets}
          onSubmit={async (payload) => {
            const result = await onSubmit(payload);
            setToast({ type: "success", message: result.message });
            setStatus(result.message);
            return result;
          }}
          onCancel={() => router.push("/admin/promotions")}
          submitLabel="Simpan perubahan"
          busyLabel="Menyimpan..."
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

  const promotion = await findPromotionById(String(params.id));
  if (!promotion) {
    return { notFound: true };
  }

  return {
    props: {
      admin: {
        email: session.adminProfile.email || session.user.email || "",
        fullName: session.adminProfile.full_name || "",
        role: session.adminProfile.role || "admin"
      },
      promotion,
      products: await getProducts(),
      outlets: await listOutlets()
    }
  };
}
