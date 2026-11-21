import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "@/styles/Admin.module.css";

const navItems = [
  { href: "/admin", label: "Produk", icon: "box" },
  { href: "/admin/categories", label: "Kategori", icon: "tag" },
  { href: "/admin/outlets", label: "Outlet", icon: "store" },
  { href: "/admin/transactions", label: "Transaksi", icon: "receipt" },
  { href: "/admin/members", label: "Member", icon: "users" },
  { href: "/admin/promotions", label: "Promosi", icon: "tag" }
];

function NavIcon({ name }) {
  if (name === "store") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9l1-5h16l1 5" />
        <path d="M4 9v10h16V9" />
        <path d="M9 19v-6h6v6" />
      </svg>
    );
  }

  if (name === "receipt") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 3h10v18l-2-1-2 1-2-1-2 1-2-1-2 1V3z" />
        <path d="M9 7h6" />
        <path d="M9 11h6" />
        <path d="M9 15h5" />
      </svg>
    );
  }

  if (name === "users") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  if (name === "tag") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.6 13.2 13.2 20.6l-10-10V3.4h7.2l10.2 9.8Z" />
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

function Avatar({ name }) {
  const safe = (name || "").trim();
  const parts = safe.split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2 ? `${parts[0][0] || ""}${parts[1][0] || ""}` : (parts[0]?.slice(0, 2) || "SS");

  return <div className={styles.adminAvatar}>{initials.toUpperCase()}</div>;
}

export default function AdminPageFrame({
  title,
  intro,
  admin,
  toast,
  onCloseToast,
  onLogout,
  primaryAction,
  children
}) {
  const router = useRouter();
  const currentPath = router.pathname || "";

  function isActiveNav(href) {
    if (href === "/admin") {
      return currentPath === "/admin" || currentPath.startsWith("/admin/products");
    }

    return currentPath === href || currentPath.startsWith(`${href}/`);
  }

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <main className={`${styles.adminPage} ${styles.adminTheme}`}>
        <div className={styles.adminBackdrop} aria-hidden="true" />
        <section className={styles.adminSurface}>
          <aside className={styles.adminSidebar}>
            <Link href="/" className={styles.adminBrand} aria-label="Kembali ke toko Street Sushi">
              <img src="/street-sushi-logo.jpg" alt="Street Sushi" className={styles.adminBrandLogo} />
              <div className={styles.adminBrandText}>
                <div className={styles.adminBrandTitle}>Street Sushi</div>
                <div className={styles.adminBrandSub}>Admin</div>
              </div>
            </Link>

            <nav className={styles.adminMenu} aria-label="Menu admin">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.adminMenuItem} ${isActiveNav(item.href) ? styles.adminMenuItemActive : ""}`}
                >
                  <span className={styles.adminMenuIcon}>
                    <NavIcon name={item.icon} />
                  </span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className={styles.adminSidebarFooter}>
              <div className={styles.adminUserRow}>
                <Avatar name={admin.fullName || admin.email} />
                <div className={styles.adminUserLine}>
                  <div className={styles.adminUserName}>{admin.fullName || admin.email}</div>
                  <div className={styles.adminUserRole}>{admin.role}</div>
                </div>
              </div>
              <div className={styles.adminSidebarActions}>
                <Link href="/" className={styles.adminSidebarLink}>
                  Lihat toko
                </Link>
                <button type="button" className={styles.adminSidebarButton} onClick={onLogout}>
                  Keluar
                </button>
              </div>
            </div>
          </aside>

          <section className={styles.adminContent}>
            {toast && (
              <div
                className={`${styles.toast} ${
                  toast.type === "error" ? styles.toastError : styles.toastSuccess
                }`}
              >
                <span>{toast.message}</span>
                <button type="button" onClick={onCloseToast}>
                  Tutup
                </button>
              </div>
            )}

            <header className={styles.adminHeader}>
              <div>
                <h1>{title}</h1>
                <p>{intro}</p>
              </div>
              <div className={styles.adminHeaderAction}>{primaryAction || null}</div>
            </header>

            {children}
          </section>
        </section>
      </main>
    </>
  );
}
