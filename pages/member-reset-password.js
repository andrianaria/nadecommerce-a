import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import StoreHeader from "@/components/StoreHeader";
import { useStoreLanguage } from "@/lib/store-language";
import styles from "@/styles/MemberAuth.module.css";

export default function MemberResetPasswordPage() {
  const router = useRouter();
  const { language, copy } = useStoreLanguage();
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [status, setStatus] = useState({ error: "", success: "" });
  const [loading, setLoading] = useState(false);
  const token = typeof router.query?.token === "string" ? router.query.token : "";

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ error: "", success: "" });

    if (!token) {
      setStatus({
        error:
          language === "en"
            ? "Password reset token was not found."
            : "Token reset password tidak ditemukan.",
        success: ""
      });
      return;
    }

    if (form.password !== form.confirmPassword) {
      setStatus({
        error:
          language === "en" ? "Password confirmation does not match yet." : "Konfirmasi password belum sama.",
        success: ""
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/member/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: form.password,
          language
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || copy.authSavePasswordAction);
      }
      setStatus({ error: "", success: data.message || copy.authPasswordUpdated });
      setTimeout(() => {
        window.location.href = "/member-login";
      }, 1200);
    } catch (error) {
      setStatus({ error: error.message, success: "" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>{copy.authResetPageTitle} | Street Sushi</title>
      </Head>
      <main className={styles.pageShell}>
        <StoreHeader compact />
        <section className={styles.panel}>
          <aside className={styles.showcase}>
            <div>
              <p className={styles.eyebrow}>{copy.authResetEyebrow}</p>
              <h1>
                {copy.authResetTitle}
                <span>{copy.authResetTitleAccent}</span>
              </h1>
              <p>{copy.authResetLead}</p>
            </div>
            <ul>
              <li className={styles.highlightBullet}>{copy.authResetHighlight}</li>
            </ul>
          </aside>

          <section className={styles.card}>
            <h2>{copy.authResetCardTitle}</h2>
            <p className={styles.subcopy}>{copy.authResetCardIntro}</p>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.row}>
                <label htmlFor="password">{copy.authNewPasswordLabel}</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={updateField}
                  placeholder={copy.authPasswordMinPlaceholder}
                  required
                />
              </div>
              <div className={styles.row}>
                <label htmlFor="confirmPassword">{copy.authConfirmPasswordLabel}</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={updateField}
                  placeholder={copy.authRepeatPasswordPlaceholder}
                  required
                />
              </div>
              <button className={styles.submit} type="submit" disabled={loading}>
                {loading ? copy.authSaving : copy.authSavePasswordAction}
              </button>
            </form>

            {status.error ? <div className={styles.error}>{status.error}</div> : null}
            {status.success ? <div className={styles.success}>{status.success}</div> : null}

            <p className={styles.switchLine}>
              <Link href="/member-login">{copy.authBackToLogin}</Link>
            </p>
          </section>
        </section>
      </main>
    </>
  );
}
