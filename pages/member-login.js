import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import StoreHeader from "@/components/StoreHeader";
import { loadGoogleIdentity } from "@/lib/google-identity";
import { useMember } from "@/lib/member-context";
import { useStoreLanguage } from "@/lib/store-language";
import styles from "@/styles/MemberAuth.module.css";

export default function MemberLoginPage() {
  const router = useRouter();
  const { setMember } = useMember();
  const { language, copy } = useStoreLanguage();
  const googleButtonRef = useRef(null);
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [status, setStatus] = useState({ error: "", success: "" });
  const [loading, setLoading] = useState(false);

  const nextUrl =
    typeof router.query?.next === "string" && router.query.next.startsWith("/")
      ? router.query.next
      : "/";

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || !googleButtonRef.current) return;

    loadGoogleIdentity()
      .then((google) => {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: async ({ credential }) => {
            setLoading(true);
            setStatus({ error: "", success: "" });
            try {
              const response = await fetch("/api/member/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential, language })
              });
              const data = await response.json();
              if (!response.ok) {
                throw new Error(data.error || copy.authLoginAction);
              }
              setMember(data.member);
              window.location.href = nextUrl;
            } catch (error) {
              setStatus({ error: error.message, success: "" });
            } finally {
              setLoading(false);
            }
          }
        });
        google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          width: 360,
          text: "continue_with"
        });
      })
      .catch((error) => setStatus({ error: error.message, success: "" }));
  }, [copy.authLoginAction, language, nextUrl, setMember]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setStatus({ error: "", success: "" });

    try {
      const response = await fetch("/api/member/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, language })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || copy.authLoginAction);
      }
      setMember(data.member);
      window.location.href = nextUrl;
    } catch (error) {
      setStatus({ error: error.message, success: "" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>{copy.authLoginPageTitle} | Street Sushi</title>
      </Head>
      <main className={styles.pageShell}>
        <StoreHeader compact />
        <section className={styles.panel}>
          <aside className={styles.showcase}>
            <div>
              <p className={styles.eyebrow}>{copy.authLoginEyebrow}</p>
              <h1>
                {copy.authLoginTitle}
                <span>{copy.authLoginTitleAccent}</span>
              </h1>
              <p>{copy.authLoginLead}</p>
            </div>
            <ul>
              <li className={styles.highlightBullet}>{copy.authLoginHighlight}</li>
            </ul>
          </aside>

          <section className={styles.card}>
            <h2>{copy.authLoginCardTitle}</h2>
            <p className={styles.subcopy}>{copy.authLoginCardIntro}</p>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.row}>
                <label htmlFor="identifier">{copy.authIdentifierLabel}</label>
                <input
                  id="identifier"
                  name="identifier"
                  value={form.identifier}
                  onChange={updateField}
                  placeholder={copy.authIdentifierPlaceholder}
                  required
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
                  placeholder={copy.authPasswordPlaceholder}
                  required
                />
              </div>
              <div className={styles.inlineActionRow}>
                <Link href="/member-forgot-password" className={styles.inlineLink}>
                  {copy.authForgotPassword}
                </Link>
              </div>
              <button className={styles.submit} type="submit" disabled={loading}>
                {loading ? copy.authProcessing : copy.authLoginAction}
              </button>
            </form>

            <div className={styles.divider}>{copy.authOr}</div>

            <div className={styles.googleWrap}>
              <div ref={googleButtonRef} />
            </div>

            {status.error ? <div className={styles.error}>{status.error}</div> : null}

            <p className={styles.switchLine}>
              {copy.authNoAccount}{" "}
              <Link href={`/member-signup?next=${encodeURIComponent(nextUrl)}`}>{copy.authSignupLink}</Link>
            </p>
          </section>
        </section>
      </main>
    </>
  );
}
