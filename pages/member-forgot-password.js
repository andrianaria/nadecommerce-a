import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import StoreHeader from "@/components/StoreHeader";
import { useStoreLanguage } from "@/lib/store-language";
import styles from "@/styles/MemberAuth.module.css";

export default function MemberForgotPasswordPage() {
  const { language, copy } = useStoreLanguage();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ error: "", success: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setStatus({ error: "", success: "" });

    try {
      const response = await fetch("/api/member/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, language })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || copy.authSendResetLink);
      }
      setStatus({ error: "", success: data.message || copy.authResetSent });
    } catch (error) {
      setStatus({ error: error.message, success: "" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>{copy.authForgotPageTitle} | Street Sushi</title>
      </Head>
      <main className={styles.pageShell}>
        <StoreHeader compact />
        <section className={styles.panel}>
          <aside className={styles.showcase}>
            <div>
              <p className={styles.eyebrow}>{copy.authForgotEyebrow}</p>
              <h1>
                {copy.authForgotTitle}
                <span>{copy.authForgotTitleAccent}</span>
              </h1>
              <p>{copy.authForgotLead}</p>
            </div>
            <ul>
              <li className={styles.highlightBullet}>{copy.authForgotHighlight}</li>
            </ul>
          </aside>

          <section className={styles.card}>
            <h2>{copy.authForgotCardTitle}</h2>
            <p className={styles.subcopy}>{copy.authForgotCardIntro}</p>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.row}>
                <label htmlFor="email">{copy.email}</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={copy.authEmailPlaceholder}
                  required
                />
              </div>
              <button className={styles.submit} type="submit" disabled={loading}>
                {loading ? copy.authSending : copy.authSendResetLink}
              </button>
            </form>

            {status.error ? <div className={styles.error}>{status.error}</div> : null}
            {status.success ? <div className={styles.success}>{status.success}</div> : null}

            <p className={styles.switchLine}>
              {copy.authRememberPassword} <Link href="/member-login">{copy.authBackToLogin}</Link>
            </p>
          </section>
        </section>
      </main>
    </>
  );
}
