import Head from "next/head";
import { useEffect } from "react";
import StoreHeader from "@/components/StoreHeader";
import { useMember } from "@/lib/member-context";
import { useStoreLanguage } from "@/lib/store-language";
import styles from "@/styles/MemberArea.module.css";

export default function MemberProfilePage() {
  const { member, loading } = useMember();
  const { copy } = useStoreLanguage();

  useEffect(() => {
    if (!loading && !member) {
      window.location.href = "/member-login";
    }
  }, [loading, member]);

  if (!member) {
    return null;
  }

  return (
    <>
      <Head>
        <title>{copy.memberProfileTitle} | Street Sushi</title>
      </Head>
      <main className={styles.pageShell}>
        <StoreHeader compact />
        <section className={styles.layout}>
          <section className={styles.heroCard}>
            <h1>{copy.memberProfileTitle}</h1>
            <p>{copy.memberProfileIntro}</p>
          </section>

          <section className={styles.profileCard}>
            <div className={styles.profileGrid}>
              <div>
                <span>{copy.fullNameLabel}</span>
                <strong>{member.fullName || "-"}</strong>
              </div>
              <div>
                <span>{copy.emailLabel}</span>
                <strong>{member.email || "-"}</strong>
              </div>
              <div>
                <span>{copy.whatsappLabel}</span>
                <strong>{member.phone || "-"}</strong>
              </div>
            </div>
          </section>
        </section>
      </main>
    </>
  );
}
