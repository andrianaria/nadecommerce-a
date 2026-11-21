import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import StoreHeader from "@/components/StoreHeader";
import { useStoreLanguage } from "@/lib/store-language";
import styles from "@/styles/MemberArea.module.css";

export default function CheckoutFailedPage() {
  const router = useRouter();
  const { copy } = useStoreLanguage();
  const orderReference = String(router.query?.order || "").trim();

  return (
    <>
      <Head>
        <title>{copy.paymentFailedTitle} | Street Sushi</title>
      </Head>
      <main className={styles.pageShell}>
        <StoreHeader compact />
        <section className={styles.layout}>
          <section className={styles.heroCard}>
            <h1>{copy.paymentFailedTitle}</h1>
            <p>{copy.paymentFailedIntro}</p>
          </section>

          <section className={styles.profileCard}>
            <div className={styles.profileGrid}>
              <div>
                <span>{copy.orderReference}</span>
                <strong>{orderReference || "-"}</strong>
              </div>
              <div>
                <span>{copy.paymentStatus}</span>
                <strong>{copy.pendingLabel}</strong>
              </div>
            </div>

            <div className={styles.orderActions}>
              <Link href="/cart" className={styles.primaryAction}>
                {copy.backToCart}
              </Link>
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
