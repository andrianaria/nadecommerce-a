import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminPageFrame from "@/components/AdminPageFrame";
import OutletForm from "@/components/admin/OutletForm";
import { getAdminSession } from "@/lib/admin-auth";
import styles from "@/styles/Admin.module.css";

export default function NewOutletPage({ admin }) {
  const router = useRouter();
  const [toast, setToast] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  async function onSubmit(payload) {
    setStatus("Menyimpan outlet...");
    const response = await fetch("/api/admin/outlets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Gagal menyimpan outlet.");
    }
    return { message: `${data.outlet.name} berhasil disimpan.` };
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin-login";
  }

  return (
    <AdminPageFrame
      title="Tambah outlet"
      intro="Tambahkan outlet baru beserta alamat dan koordinat."
      admin={admin}
      toast={toast}
      onCloseToast={() => setToast(null)}
      onLogout={logout}
    >
      <section className={styles.stackGrid}>
        <OutletForm
          onSubmit={async (payload) => {
            const result = await onSubmit(payload);
            setToast({ type: "success", message: result.message });
            setStatus(result.message);
            setTimeout(() => router.push("/admin/outlets"), 350);
            return result;
          }}
          onCancel={() => router.push("/admin/outlets")}
          submitLabel="Simpan outlet"
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
      }
    }
  };
}

