import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminPageFrame from "@/components/AdminPageFrame";
import { getAdminSession } from "@/lib/admin-auth";
import styles from "@/styles/Admin.module.css";

export default function NewCategoryPage({ admin }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [toast, setToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setStatus("Menyimpan kategori...");

    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Gagal menyimpan kategori.");
      }
      setStatus("Kategori berhasil disimpan.");
      setToast({ type: "success", message: "Kategori berhasil disimpan." });
      setTimeout(() => router.push("/admin/categories"), 350);
    } catch (error) {
      setStatus(error.message);
      setToast({ type: "error", message: error.message });
    } finally {
      setIsSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin-login";
  }

  return (
    <AdminPageFrame
      title="Tambah kategori"
      intro="Tambahkan kategori baru untuk dipakai di form produk dan filter katalog."
      admin={admin}
      toast={toast}
      onCloseToast={() => setToast(null)}
      onLogout={logout}
    >
      <section className={styles.stackGrid}>
        <form className={styles.formCard} onSubmit={handleSubmit}>
          <label>
            Nama kategori
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Contoh: Hampers"
              required
            />
          </label>

          <p className={styles.formStatus}>{status}</p>

          <div className={styles.formActions}>
            <button type="button" className={styles.ghostButton} onClick={() => router.push("/admin/categories")}>
              Batal
            </button>
            <button type="submit" className={styles.primaryButton} disabled={isSaving}>
              {isSaving ? "Menyimpan..." : "Simpan kategori"}
            </button>
          </div>
        </form>
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
