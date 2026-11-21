import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCart } from "@/lib/cart-context";
import { useMember } from "@/lib/member-context";
import { useStoreLanguage } from "@/lib/store-language";
import styles from "@/styles/StoreHeader.module.css";

export default function StoreHeader({ compact = false, hideHomeLink = false }) {
  const router = useRouter();
  const { itemCount } = useCart();
  const { language, setLanguage, copy } = useStoreLanguage();
  const { member, logout } = useMember();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  async function handleLogout() {
    await logout();
    window.location.href = "/";
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = [
    { key: "home", href: "/", label: copy.home, match: "/" },
    {
      key: "products-packages",
      href: { pathname: "/produk" },
      label: copy.productsPackagesNav,
      matchPage: "/produk",
      match: "/produk"
    },
    { key: "how-to-order", href: "/cara-pesan", label: copy.howToOrderNav, match: "/cara-pesan" },
    { key: "faq", href: "/faq", label: copy.faqNav, match: "/faq" }
  ];

  return (
    <header className={`${styles.header} ${compact ? styles.compact : ""}`}>
      <Link href="/" className={styles.brand}>
        <img
          src="/street-sushi-logo.jpg"
          alt="Street Sushi logo"
          className={styles.logo}
        />
      </Link>

      <div className={styles.actions}>
        <nav className={styles.primaryNav}>
          {menuItems.map((item, index) => {
            const isHome = item.match === "/";
            const isActive =
              item.matchCategory
                ? false
                : item.match
                  ? router.pathname === item.match && !(hideHomeLink && isHome)
                  : false;

            return (
              <Link
                key={item.key}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <nav className={styles.nav}>
          <Link href="/cart" className={styles.cartIconLink} aria-label={copy.openCart}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M3.5 5.5h2.1a1 1 0 0 1 .96.72L7.2 8.5m0 0h12.05a1 1 0 0 1 .96 1.28l-1.48 5.18a1.5 1.5 0 0 1-1.44 1.09H9.28a1.5 1.5 0 0 1-1.45-1.12L7.2 8.5Zm0 0-.63-2.28M10 8.9v6.5m4.2-6.5v6.5m4.2-6.5-.8 6.5M8.1 12.2h11M9.3 19.4a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0Zm10 0a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0Z"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
              />
            </svg>
            <span>{itemCount}</span>
          </Link>
          {member ? (
            <div className={styles.memberMenuWrap} ref={menuRef}>
              <button
                type="button"
                className={styles.memberIconButton}
                aria-label={copy.accountMenu}
                onClick={() => setMenuOpen((current) => !current)}
              >
                {(member.fullName || "SS")
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase()}
              </button>

              {menuOpen ? (
                <div className={styles.memberDropdown}>
                  <div className={styles.memberDropdownHeader}>
                    <strong>{member.fullName || "Member"}</strong>
                    <span>{member.email || member.phone || ""}</span>
                  </div>
                  <Link
                    href="/member/profile"
                    className={styles.memberDropdownLink}
                    onClick={() => setMenuOpen(false)}
                  >
                    {copy.profile}
                  </Link>
                  <Link
                    href="/member/orders"
                    className={styles.memberDropdownLink}
                    onClick={() => setMenuOpen(false)}
                  >
                    {copy.orders}
                  </Link>
                  <button
                    type="button"
                    className={styles.memberDropdownButton}
                    onClick={handleLogout}
                  >
                    {copy.memberLogout}
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <Link href="/member-login" className={styles.ghostLink}>
                {copy.memberLogin}
              </Link>
              <Link href="/member-signup" className={styles.memberButton}>
                {copy.memberSignup}
              </Link>
            </>
          )}
        </nav>

        <div className={styles.languageSwitcher}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18Zm6.92 8h-3.08a14.8 14.8 0 0 0-1.4-5.02A7.53 7.53 0 0 1 18.92 11ZM12 4.56c.92 1.24 1.82 3.38 2.14 6.44H9.86C10.18 7.94 11.08 5.8 12 4.56ZM5.08 13h3.08c.14 1.82.58 3.56 1.28 5.02A7.53 7.53 0 0 1 5.08 13Zm3.08-2H5.08a7.53 7.53 0 0 1 4.36-5.02A14.8 14.8 0 0 0 8.16 11Zm3.84 8.44c-.92-1.24-1.82-3.38-2.14-6.44h4.28c-.32 3.06-1.22 5.2-2.14 6.44ZM14.56 18.02c.7-1.46 1.14-3.2 1.28-5.02h3.08a7.53 7.53 0 0 1-4.36 5.02Z"
              fill="currentColor"
            />
          </svg>
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            aria-label={copy.language}
          >
            <option value="id">Bahasa</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
    </header>
  );
}
