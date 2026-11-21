import Head from "next/head";
import Link from "next/link";
import StoreHeader from "@/components/StoreHeader";
import { formatRupiah } from "@/lib/formatters";
import { getProducts } from "@/lib/product-store";
import { getLocalizedProduct, useStoreLanguage } from "@/lib/store-language";
import styles from "@/styles/HowToOrder.module.css";

const stepsCopy = {
  id: [
    {
      number: "1",
      title: "Pilih Menu Favoritmu",
      body: "Lihat pilihan sushi cake, ukuran, porsi, dan harga. Pilih menu yang paling cocok untuk momenmu.",
      icon: "🍣"
    },
    {
      number: "2",
      title: "Tentukan Tanggal & Metode",
      body: "Pilih tanggal, jam, serta metode pengambilan: pickup atau delivery.",
      icon: "🗓️"
    },
    {
      number: "3",
      title: "Isi Detail Pesanan",
      body: "Tambahkan nama pemesan, nomor WhatsApp, alamat jika delivery, serta ucapan atau topper bila diperlukan.",
      icon: "📝"
    },
    {
      number: "4",
      title: "Konfirmasi & Pembayaran",
      body: "Lakukan pembayaran DP atau full payment. Tim kami akan mengonfirmasi, lalu pesanan disiapkan fresh.",
      icon: "💳"
    }
  ],
  en: [
    {
      number: "1",
      title: "Pick Your Favorite Menu",
      body: "Browse sushi cake options, portions, and pricing. Choose the one that fits your moment best.",
      icon: "🍣"
    },
    {
      number: "2",
      title: "Set Date & Method",
      body: "Choose your preferred date, time, and whether you want pickup or delivery.",
      icon: "🗓️"
    },
    {
      number: "3",
      title: "Fill in Order Details",
      body: "Add the buyer name, WhatsApp number, delivery address if needed, plus card greeting or topper notes.",
      icon: "📝"
    },
    {
      number: "4",
      title: "Confirm & Pay",
      body: "Complete the payment. Our team will confirm everything and prepare your order fresh.",
      icon: "💳"
    }
  ]
};

const importantCopy = {
  id: {
    title: "Info Penting",
    points: [
      "Pesan di app minimal H-1",
      "Jika butuh cepat dapat langsung pesan via WhatsApp",
      "Pickup & delivery tersedia",
      "Cocok untuk ulang tahun, kantor, dan surprise party"
    ],
    example: "Contoh Pesanan",
    note: "Kamu bisa menambahkan ucapan atau topper di langkah isi detail pesanan.",
    ctaTitle: "Siap rayakan momen spesialmu?",
    ctaBody: "Pilih menu favoritmu sekarang dan buat momenmu lebih berkesan dengan sushi cake dari Street Sushi.",
    menuCta: "Lihat Menu & Harga",
    whatsappCta: "Pesan via WhatsApp",
    whatsappHelper: "Butuh cepat atau pesanan mendadak? Langsung chat WhatsApp, tim kami siap bantu!"
  },
  en: {
    title: "Important Info",
    points: [
      "Order in the app at least D-2",
      "Need it faster? Order directly via WhatsApp",
      "Pickup & delivery available",
      "Perfect for birthdays, office treats, and surprise parties"
    ],
    example: "Sample Order",
    note: "You can add a greeting card or topper note during the order detail step.",
    ctaTitle: "Ready to celebrate your special moment?",
    ctaBody: "Pick your favorite menu now and make the moment more memorable with Street Sushi cakes.",
    menuCta: "See Menu & Pricing",
    whatsappCta: "Order via WhatsApp",
    whatsappHelper: "Need it fast or have an urgent order? Chat us on WhatsApp and our team will help."
  }
};

function buildWhatsappLink(language) {
  const text =
    language === "en"
      ? "Hello, I want to order a Sushi Cake as soon as possible. Is that possible?"
      : "Halo saya mau pesan Sushi cake secepatnya apakah bisa?";
  return `https://example.com/contact/?text=${encodeURIComponent(text)}`;
}

export default function HowToOrderPage({ products }) {
  const { language } = useStoreLanguage();
  const spotlightProduct =
    products.find((product) => product.spotlight) ||
    products.find((product) => product.featured) ||
    products[0];
  const spotlight = getLocalizedProduct(spotlightProduct, language);
  const steps = stepsCopy[language] || stepsCopy.id;
  const copy = importantCopy[language] || importantCopy.id;
  const whatsappHref = buildWhatsappLink(language);

  return (
    <>
      <Head>
        <title>{language === "en" ? "How to Order | Street Sushi" : "Cara Pesan | Street Sushi"}</title>
      </Head>

      <main className={styles.pageShell}>
        <div className={styles.canvas}>
          <StoreHeader />

          <section className={styles.hero}>
            <p className={styles.eyebrow}>{language === "en" ? "How to order sushi cake" : "Cara pesan sushi cake"}</p>
            <h1>
              {language === "en" ? "How to Order" : "Cara Pesan"} <span>Sushi Cake</span>
            </h1>
            <p className={styles.heroLead}>
              {language === "en"
                ? "Place your app order at least D-2. Need it faster? Order directly through WhatsApp."
                : "Pesan di app minimal H-1. Butuh lebih cepat? Langsung pesan via WhatsApp."}
            </p>
          </section>

          <section className={styles.stepsGrid}>
            {steps.map((step, index) => (
              <article key={step.number} className={styles.stepCard}>
                <span className={styles.stepNumber}>{step.number}</span>
                <div className={styles.stepIcon}>{step.icon}</div>
                <h2>{step.title}</h2>
                <p>{step.body}</p>
                {index < steps.length - 1 ? <span className={styles.stepConnector}>→</span> : null}
              </article>
            ))}
          </section>

          <section className={styles.infoGrid}>
            <article className={styles.infoCard}>
              <div className={styles.infoIcon}>i</div>
              <div>
                <h3>{copy.title}</h3>
                <ul className={styles.infoList}>
                  {copy.points.map((point) => (
                    <li key={point}>
                      <span className={styles.infoCheck}>✓</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>

            <article className={styles.exampleCard}>
              <div className={styles.exampleMedia}>
                {spotlight.coverImageUrl ? (
                  <img src={spotlight.coverImageUrl} alt={spotlight.name} className={styles.exampleImage} />
                ) : (
                  <div className={styles.exampleFallback} />
                )}
              </div>

              <div className={styles.exampleContent}>
                <p className={styles.exampleEyebrow}>{copy.example}</p>
                <h3>{spotlight.name}</h3>
                <p className={styles.exampleTagline}>{spotlight.tagline}</p>

                <div className={styles.examplePriceRow}>
                  <strong>{formatRupiah(spotlight.price)}</strong>
                  <span className={styles.peopleMeta}>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M16.5 11a3.5 3.5 0 1 0-2.64-5.8A4.5 4.5 0 1 0 9 12a4.98 4.98 0 0 0-4.58 3.02A1.5 1.5 0 0 0 5.8 17h11.4a1.5 1.5 0 0 0 1.38-1.98A4.98 4.98 0 0 0 14 12c.95 0 1.84-.27 2.6-.74.55.45 1.25.74 2.02.74a3.38 3.38 0 0 0 1.86-.55A3.99 3.99 0 0 1 22 15a1 1 0 0 1-1 1h-1.25"
                        fill="currentColor"
                      />
                    </svg>
                    {spotlight.serves}
                  </span>
                </div>

                <div className={styles.exampleMetaGrid}>
                  <span>{spotlight.pieces} pcs</span>
                  <span>{language === "en" ? "Pickup" : "Pickup"}</span>
                  <span>{language === "en" ? "H+2 schedule" : "Jadwal H+2"}</span>
                </div>

                <div className={styles.exampleNote}>{copy.note}</div>
              </div>
            </article>
          </section>

          <section className={styles.ctaPanel}>
            <div className={styles.ctaCakeWrap}>
              <img
                src="/how-to-order-cake-transparent.png"
                alt={spotlight.name}
                className={styles.ctaCakeImage}
              />
            </div>

            <div className={styles.ctaCopy}>
              <h2>{copy.ctaTitle}</h2>
              <p>{copy.ctaBody}</p>
            </div>

            <div className={styles.ctaActions}>
              <Link href="/#catalog" className={styles.menuButton}>
                {copy.menuCta}
              </Link>
              <a href={whatsappHref} className={styles.whatsappButton} target="_blank" rel="noreferrer">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12 3.2a8.73 8.73 0 0 0-7.55 13.11L3.2 20.8l4.61-1.21A8.8 8.8 0 1 0 12 3.2Zm0 15.96a7.17 7.17 0 0 1-3.64-1l-.26-.15-2.74.72.73-2.67-.17-.28A7.22 7.22 0 1 1 12 19.16Zm3.95-5.43c-.22-.11-1.28-.63-1.47-.7-.2-.07-.34-.11-.49.11-.15.22-.56.7-.7.84-.13.15-.25.16-.47.06-.22-.11-.92-.34-1.76-1.08-.65-.58-1.1-1.3-1.23-1.52-.13-.22-.01-.34.1-.45.1-.1.22-.26.33-.39.11-.13.15-.22.22-.37.07-.15.04-.28-.02-.39-.06-.11-.49-1.18-.67-1.62-.17-.42-.35-.36-.49-.36h-.42c-.15 0-.39.06-.59.28-.2.22-.77.75-.77 1.83 0 1.08.79 2.13.9 2.28.11.15 1.56 2.38 3.77 3.34.53.23.94.37 1.26.47.53.17 1 .14 1.38.09.42-.06 1.28-.52 1.46-1.03.18-.51.18-.94.13-1.03-.06-.09-.2-.15-.42-.26Z"
                    fill="currentColor"
                  />
                </svg>
                {copy.whatsappCta}
              </a>
              <p>{copy.whatsappHelper}</p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export async function getServerSideProps() {
  return {
    props: {
      products: await getProducts()
    }
  };
}
