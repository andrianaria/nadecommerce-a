import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminPageFrame from "@/components/AdminPageFrame";
import OutletForm from "@/components/admin/OutletForm";
import { getAdminSession } from "@/lib/admin-auth";
import { listOutlets } from "@/lib/outlet-store";
import styles from "@/styles/Admin.module.css";

export default function EditOutletPage({ admin, outlet }) {
  const router = useRouter();
  const [toast, setToast] = useState(null);
  const [status, setStatus] = useState(outlet ? `Mengedit ${outlet.name}.` : "Outlet tidak ditemukan.");

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  async function onSubmit(payload) {
    setStatus("Memperbarui outlet...");
    const response = await fetch(`/api/admin/outlets/${encodeURIComponent(outlet.id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Gagal memperbarui outlet.");
    }
    return { message: `${data.outlet.name} berhasil diperbarui.` };
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin-login";
  }

  if (!outlet) {
    return (
      <AdminPageFrame
        title="Outlet tidak ditemukan"
        intro="Outlet yang kamu cari tidak ada atau sudah dihapus."
        admin={admin}
        toast={toast}
        onCloseToast={() => setToast(null)}
        onLogout={logout}
      >
        <section className={styles.panelCard}>
          <button type="button" className={styles.primaryButton} onClick={() => router.push("/admin/outlets")}>
            Kembali ke daftar outlet
          </button>
        </section>
      </AdminPageFrame>
    );
  }

  return (
    <AdminPageFrame
      title="Ubah outlet"
      intro="Ubah data outlet. Simpan untuk menerapkan perubahan."
      admin={admin}
      toast={toast}
      onCloseToast={() => setToast(null)}
      onLogout={logout}
    >
      <section className={styles.stackGrid}>
        <OutletForm
          initialOutlet={outlet}
          onSubmit={async (payload) => {
            const result = await onSubmit(payload);
            setToast({ type: "success", message: result.message });
            setStatus(result.message);
            setTimeout(() => router.push("/admin/outlets"), 350);
            return result;
          }}
          onCancel={() => router.push("/admin/outlets")}
          submitLabel="Perbarui outlet"
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

  const outlets = await listOutlets();
  const outlet = outlets.find((entry) => String(entry.id) === params.id) || null;

  return {
    props: {
      admin: {
        email: session.adminProfile.email || session.user.email || "",
        fullName: session.adminProfile.full_name || "",
        role: session.adminProfile.role || "admin"
      },
      outlet
    }
  };
}

