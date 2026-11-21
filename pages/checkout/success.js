import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import StoreHeader from "@/components/StoreHeader";
import { useMember } from "@/lib/member-context";
import { useStoreLanguage } from "@/lib/store-language";
import styles from "@/styles/MemberArea.module.css";

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const { member } = useMember();
  const { copy } = useStoreLanguage();
  const orderReference = String(router.query?.order || "").trim();

  return (
    <>
      <Head>
        <title>{copy.paymentSuccessTitle} | Street Sushi</title>
      </Head>
      <main className={styles.pageShell}>
        <StoreHeader compact />
        <section className={styles.layout}>
          <section className={styles.heroCard}>
            <h1>{copy.paymentSuccessTitle}</h1>
            <p>{copy.paymentSuccessIntro}</p>
          </section>

          <section className={styles.profileCard}>
            <div className={styles.profileGrid}>
              <div>
                <span>{copy.orderReference}</span>
                <strong>{orderReference || "-"}</strong>
              </div>
              <div>
                <span>{copy.paymentStatus}</span>
                <strong>{copy.paidLabel}</strong>
              </div>
            </div>

            <div className={styles.orderActions}>
              {member ? (
                <Link href="/member/orders" className={styles.primaryAction}>
                  {copy.viewMyOrders}
                </Link>
              ) : (
                <Link href="/member-login" className={styles.primaryAction}>
                  {copy.loginToTrack}
                </Link>
              )}
              <Link href="/" className={styles.secondaryAction}>
                {copy.continueShopping}
              </Link>
            </div>
          </section>
        </section>
      </main>
    </>
  );
}
