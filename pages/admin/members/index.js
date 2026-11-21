import { useEffect, useMemo, useState } from "react";
import AdminPageFrame from "@/components/AdminPageFrame";
import AdminTable from "@/components/admin/AdminTable";
import { getAdminSession } from "@/lib/admin-auth";
import styles from "@/styles/Admin.module.css";

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function MemberListPage({ admin }) {
  const [members, setMembers] = useState([]);
  const [status, setStatus] = useState("Memuat member...");
  const [toast, setToast] = useState(null);
  const [busyId, setBusyId] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    linkStatus: "all"
  });

  async function loadMembers() {
    const response = await fetch("/api/admin/members");
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Gagal memuat member.");
    }
    setMembers(data.members || []);
    setStatus("Data member berhasil disinkronkan.");
  }

  useEffect(() => {
    loadMembers().catch((error) => setStatus(error.message));
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const rows = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return members.filter((member) => {
      const linked = Boolean(member.metadata?.franchiseLinked);
      const matchesQuery =
        !query ||
        member.fullName?.toLowerCase().includes(query) ||
        member.email?.toLowerCase().includes(query) ||
        member.phone?.toLowerCase().includes(query);
      const matchesLink =
        filters.linkStatus === "all" ||
        (filters.linkStatus === "linked" && linked) ||
        (filters.linkStatus === "failed" && !linked);
      return matchesQuery && matchesLink;
    });
  }, [filters, members]);

  const linkedCount = members.filter((member) => member.metadata?.franchiseLinked).length;
  const failedCount = members.length - linkedCount;

  async function reconnectOne(member) {
    setBusyId(member.id);
    setStatus(`Reconnect member ${member.fullName}...`);
    try {
      const response = await fetch(`/api/admin/members/${member.id}`, {
        method: "POST"
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Reconnect gagal.");
      }
      await loadMembers();
      setToast({ type: "success", message: `Member ${member.fullName} berhasil dihubungkan.` });
    } catch (error) {
      setToast({ type: "error", message: error.message });
      setStatus(error.message);
    } finally {
      setBusyId("");
    }
  }

  async function reconnectFailed() {
    setBusyId("bulk");
    setStatus("Reconnect semua member yang gagal...");
    try {
      const response = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reconnect_failed" })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Bulk reconnect gagal.");
      }
      const successCount = (data.results || []).filter((item) => item.ok).length;
      await loadMembers();
      setToast({
        type: "success",
        message: `${successCount} member berhasil dicoba hubungkan ulang.`
      });
    } catch (error) {
      setToast({ type: "error", message: error.message });
      setStatus(error.message);
    } finally {
      setBusyId("");
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin-login";
  }

  const columns = [
    {
      key: "member",
      label: "Member",
      render: (member) => (
        <div>
          <strong>{member.fullName || "-"}</strong>
          <div className={styles.muted}>{member.email || member.phone || "-"}</div>
        </div>
      )
    },
    {
      key: "phone",
      label: "WhatsApp",
      render: (member) => member.phone || "-"
    },
    {
      key: "provider",
      label: "Login",
      render: (member) => member.authProvider || "-"
    },
    {
      key: "franchise",
      label: "Franchisee",
      render: (member) =>
        member.metadata?.franchiseLinked ? (
          <div className={styles.pillRow}>
            <span className={styles.pillSuccess}>Terhubung</span>
            <span className={styles.muted}>ID {member.franchiseCustomerId || "-"}</span>
          </div>
        ) : (
          <div className={styles.pillRow}>
            <span className={styles.pillWarning}>Belum terhubung</span>
            <span className={styles.muted}>
              {member.metadata?.franchiseReason || "unknown"}
            </span>
          </div>
        )
    },
    {
      key: "createdAt",
      label: "Daftar",
      render: (member) => formatDateTime(member.createdAt)
    },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (member) =>
        member.metadata?.franchiseLinked ? (
          <span className={styles.muted}>Sudah ok</span>
        ) : (
          <button
            type="button"
            className={styles.inlineLinkButton}
            onClick={() => reconnectOne(member)}
            disabled={busyId === member.id || busyId === "bulk"}
          >
            {busyId === member.id ? "Memproses..." : "Reconnect"}
          </button>
        )
    }
  ];

  const primaryAction = (
    <button
      type="button"
      className={styles.primaryLinkButton}
      onClick={reconnectFailed}
      disabled={busyId === "bulk"}
    >
      {busyId === "bulk" ? "Memproses..." : "Reconnect yang gagal"}
    </button>
  );

  return (
    <AdminPageFrame
      title="Member"
      intro="Kelola akun customer member dan hubungkan ulang ke tabel customer franchisee bila sebelumnya gagal."
      admin={admin}
      toast={toast}
      onCloseToast={() => setToast(null)}
      onLogout={logout}
      primaryAction={primaryAction}
    >
      <section className={styles.statRow}>
        <div className={styles.statCard}>
          <div>
            <div className={styles.statLabel}>Total member</div>
            <div className={styles.statValue}>{members.length}</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div>
            <div className={styles.statLabel}>Sudah terhubung</div>
            <div className={styles.statValue}>{linkedCount}</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div>
            <div className={styles.statLabel}>Perlu reconnect</div>
            <div className={styles.statValue}>{failedCount}</div>
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
                placeholder="Nama, email, atau nomor"
              />
            </label>
            <label className={styles.filterField}>
              <span>Status link</span>
              <select
                value={filters.linkStatus}
                onChange={(e) => setFilters((c) => ({ ...c, linkStatus: e.target.value }))}
              >
                <option value="all">Semua</option>
                <option value="linked">Terhubung</option>
                <option value="failed">Belum terhubung</option>
              </select>
            </label>
          </div>
        </div>

        <p className={styles.formStatus}>{status}</p>
      </section>

      <AdminTable
        columns={columns}
        rows={rows}
        rowKey={(member) => member.id}
        emptyText="Belum ada member."
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
      }
    }
  };
}
