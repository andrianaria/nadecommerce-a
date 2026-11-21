import { useState } from "react";
import Head from "next/head";
import styles from "@/styles/Login.module.css";

function PasswordEyeIcon({ visible }) {
  if (visible) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 3l18 18" />
        <path d="M10.58 10.58a2 2 0 102.83 2.83" />
        <path d="M9.88 5.09A10.94 10.94 0 0112 4.91c5.05 0 9.27 3.11 10.5 7.5a10.97 10.97 0 01-3.18 4.92" />
        <path d="M6.61 6.61A10.96 10.96 0 001.5 12.41c.61 2.18 2.01 4.06 3.9 5.39" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1.5 12s3.82-7.09 10.5-7.09S22.5 12 22.5 12s-3.82 7.09-10.5 7.09S1.5 12 1.5 12z" />
      <circle cx="12" cy="12" r="3.1" />
    </svg>
  );
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("Sedang masuk...");

    let response;

    try {
      response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });
    } catch (error) {
      setStatus(error?.message || "Koneksi bermasalah. Coba lagi ya.");
      setIsSubmitting(false);
      return;
    }

    if (response.ok) {
      window.location.href = "/admin";
      return;
    }

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    setStatus(data?.error || `Login gagal (${response.status}).`);
    setIsSubmitting(false);
  }

  return (
    <>
      <Head>
        <title>Login Admin Street Sushi</title>
      </Head>

      <main className={styles.loginShell}>
        <section className={styles.loginCard}>
          <img
            src="/street-sushi-logo.jpg"
            alt="Street Sushi logo"
            className={styles.logo}
          />
          <p className={styles.eyebrow}>Akses admin</p>
          <h1>Login Admin</h1>
          <p className={styles.copy}>
            Masuk untuk mengelola produk, harga, outlet, dan pesanan masuk.
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="support@example.com"
                autoFocus
                required
              />
            </label>

            <label>
              Kata sandi
              <div className={styles.passwordField}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Kata sandi"
                  required
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                >
                  <PasswordEyeIcon visible={showPassword} />
                </button>
              </div>
            </label>

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sedang masuk..." : "Masuk"}
            </button>
          </form>

          <p className={styles.status}>{status}</p>
          <a href="/" className={styles.backLink}>
            Kembali ke toko
          </a>
        </section>
      </main>
    </>
  );
}
