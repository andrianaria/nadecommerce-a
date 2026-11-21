import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import StoreHeader from "@/components/StoreHeader";
import { useMember } from "@/lib/member-context";
import { useStoreLanguage } from "@/lib/store-language";
import styles from "@/styles/MemberAuth.module.css";

export default function MemberSignupPage() {
  const router = useRouter();
  const { setMember } = useMember();
  const { language, copy } = useStoreLanguage();
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: ""
  });
  const [status, setStatus] = useState({ error: "", success: "" });
  const [loading, setLoading] = useState(false);
  const nextUrl =
    typeof router.query?.next === "string" && router.query.next.startsWith("/")
      ? router.query.next
      : "/";

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setStatus({ error: "", success: "" });

    try {
      const response = await fetch("/api/member/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, language })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || copy.authCreateAccountAction);
      }
      setMember(data.member);
      setStatus({ error: "", success: copy.authAccountCreated });
      setTimeout(() => {
        window.location.href = nextUrl;
      }, 900);
    } catch (error) {
      setStatus({ error: error.message, success: "" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>{copy.authSignupPageTitle} | Street Sushi</title>
      </Head>
      <main className={styles.pageShell}>
        <StoreHeader compact />
        <section className={styles.panel}>
          <aside className={styles.showcase}>
            <div>
              <img src="/street-sushi-logo.jpg" alt="Street Sushi" />
              <p className={styles.eyebrow}>{copy.authSignupEyebrow}</p>
              <h1>
                {copy.authSignupTitle}
                <span>{copy.authSignupTitleAccent}</span>
              </h1>
              <p>{copy.authSignupLead}</p>
            </div>
            <ul>
              <li>{copy.authSignupBullet1}</li>
              <li>{copy.authSignupBullet2}</li>
              <li>{copy.authSignupBullet3}</li>
            </ul>
          </aside>

          <section className={styles.card}>
            <h2>{copy.authSignupCardTitle}</h2>
            <p className={styles.subcopy}>{copy.authSignupCardIntro}</p>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.row}>
                <label htmlFor="fullName">{copy.fullNameLabel}</label>
                <input
                  id="fullName"
                  name="fullName"
                  value={form.fullName}
                  onChange={updateField}
                  placeholder={copy.authFullNamePlaceholder}
                  required
                />
              </div>
              <div className={styles.row}>
                <label htmlFor="phone">{copy.authPhoneLabel}</label>
                <input
                  id="phone"
                  name="phone"
                  value={form.phone}
                  onChange={updateField}
                  placeholder={copy.authPhonePlaceholder}
                  required
                />
              </div>
              <div className={styles.row}>
                <label htmlFor="email">{copy.email}</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={updateField}
                  placeholder={copy.authEmailPlaceholder}
                />
              </div>
              <div className={styles.row}>
                <label htmlFor="password">{copy.authPasswordLabel}</label>
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
              <button className={styles.submit} type="submit" disabled={loading}>
                {loading ? copy.authCreatingAccount : copy.authCreateAccountAction}
              </button>
            </form>

            {status.error ? <div className={styles.error}>{status.error}</div> : null}
            {status.success ? <div className={styles.success}>{status.success}</div> : null}

            <p className={styles.switchLine}>
              {copy.authHasAccount}{" "}
              <Link href={`/member-login?next=${encodeURIComponent(nextUrl)}`}>{copy.authLoginHere}</Link>
            </p>
          </section>
        </section>
      </main>
    </>
  );
}
