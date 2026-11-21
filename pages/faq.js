import Head from "next/head";
import Link from "next/link";
import { useMemo, useState } from "react";
import StoreHeader from "@/components/StoreHeader";
import { useStoreLanguage } from "@/lib/store-language";
import styles from "@/styles/Faq.module.css";

const faqContent = {
  id: {
    heroEyebrow: "FAQ",
    heroTitle: "Pertanyaan yang",
    heroAccent: "sering ditanyakan",
    heroLead:
      "Temukan jawaban dari pertanyaan yang paling sering ditanyakan tentang Sushi Cake, pemesanan, pembayaran, dan pengiriman.",
    categories: [
      { key: "all", label: "Semua", icon: "⌘" },
      { key: "ordering", label: "Pemesanan", icon: "🛒" },
      { key: "product", label: "Produk", icon: "◻" },
      { key: "payment", label: "Pembayaran", icon: "💳" },
      { key: "delivery", label: "Pengiriman", icon: "🚚" },
      { key: "other", label: "Lainnya", icon: "◎" }
    ],
    faqs: [
      {
        category: "ordering",
        question: "Berapa minimal pemesanan Sushi Cake?",
        answer:
          "Untuk pemesanan lewat website, kami sarankan order minimal H-1 supaya tim outlet punya waktu menyiapkan pesanan dengan fresh dan tepat waktu."
      },
      {
        category: "ordering",
        question: "Kapan harus melakukan pemesanan?",
        answer:
          "Idealnya pesan minimal 2 hari sebelum tanggal kirim. Kalau butuh lebih cepat, kamu tetap bisa hubungi tim kami via WhatsApp untuk cek ketersediaan outlet."
      },
      {
        category: "product",
        question: "Bisa custom tulisan atau tema di Sushi Cake?",
        answer:
          "Bisa untuk beberapa kebutuhan tertentu, seperti ucapan kartu, topper, atau detail tambahan. Untuk request khusus, tulis di catatan pesanan atau hubungi WhatsApp kami."
      },
      {
        category: "product",
        question: "Apakah semua Sushi Cake halal?",
        answer:
          "Ya, Street Sushi menggunakan bahan yang halal dan dipilih untuk tetap enak, aman, dan cocok untuk berbagai momen perayaan."
      },
      {
        category: "payment",
        question: "Bagaimana cara pembayaran?",
        answer:
          "Pembayaran utama dilakukan secara online saat checkout. Jika butuh pembayaran manual, kamu bisa menghubungi CS kami melalui WhatsApp."
      },
      {
        category: "ordering",
        question: "Apakah bisa pesan mendadak / hari ini?",
        answer:
          "Bisa saja tergantung outlet, menu, dan slot delivery yang tersedia. Cara paling cepat adalah chat WhatsApp supaya tim kami bisa cek kemungkinan pesanan ekspres."
      },
      {
        category: "delivery",
        question: "Apakah bisa dikirim ke luar kota?",
        answer:
          "Saat ini pengiriman mengikuti coverage outlet dan kurir yang tersedia. Untuk area yang belum terjangkau, tim kami akan bantu cek alternatif manual."
      },
      {
        category: "other",
        question: "Bagaimana cara penyimpanan Sushi Cake?",
        answer:
          "Simpan di kulkas dan konsumsi dalam kondisi dingin agar tekstur dan rasa tetap optimal. Untuk hasil terbaik, nikmati di hari yang sama."
      }
    ],
    contactTitle: "Masih ada",
    contactAccent: "pertanyaan?",
    contactLead: "Tim Street Sushi siap membantu kamu setiap hari.",
    whatsappLabel: "Chat via WhatsApp",
    instagramLabel: "DM Instagram",
    hoursLabel: "Jam Operasional",
    hoursValue: "11.00 - 21.00 WIB",
    contactButton: "Hubungi Kami",
    storageTitle: "Tips Penyimpanan",
    storageBody: "Simpan di kulkas dan konsumsi dalam kondisi dingin untuk rasa terbaik.",
    bottomTitle: "Pesan Sushi Cake minimal H-1",
    bottomBody: "Untuk memastikan pesanan kamu dibuat fresh dan tepat waktu.",
    bottomButton: "Lihat Cara Pesan"
  },
  en: {
    heroEyebrow: "FAQ",
    heroTitle: "Questions that are",
    heroAccent: "asked the most",
    heroLead:
      "Find answers to the most common questions about Sushi Cake, ordering, payment, and delivery.",
    categories: [
      { key: "all", label: "All", icon: "⌘" },
      { key: "ordering", label: "Ordering", icon: "🛒" },
      { key: "product", label: "Product", icon: "◻" },
      { key: "payment", label: "Payment", icon: "💳" },
      { key: "delivery", label: "Delivery", icon: "🚚" },
      { key: "other", label: "Other", icon: "◎" }
    ],
    faqs: [
      {
        category: "ordering",
        question: "What is the minimum lead time for ordering Sushi Cake?",
        answer:
          "For website orders, we recommend placing your order at least D-2 so the outlet team has enough time to prepare everything fresh and on schedule."
      },
      {
        category: "ordering",
        question: "When should I place my order?",
        answer:
          "Ideally, place your order at least 2 days before the delivery date. If you need it sooner, you can still contact our team on WhatsApp to check outlet availability."
      },
      {
        category: "product",
        question: "Can I request a custom message or theme for the Sushi Cake?",
        answer:
          "Yes, for certain needs such as card greetings, toppers, or extra details. For special requests, leave a note in your order or contact us via WhatsApp."
      },
      {
        category: "product",
        question: "Are all Sushi Cakes halal?",
        answer:
          "Yes. Street Sushi uses halal ingredients selected to stay delicious, safe, and suitable for many kinds of celebrations."
      },
      {
        category: "payment",
        question: "How does payment work?",
        answer:
          "Main payments are processed online during checkout. If you need a manual payment option, please contact our customer service via WhatsApp."
      },
      {
        category: "ordering",
        question: "Can I place a same-day or last-minute order?",
        answer:
          "It depends on the outlet, selected menu, and available delivery slots. The fastest way is to chat us on WhatsApp so our team can check express order options."
      },
      {
        category: "delivery",
        question: "Can you deliver outside the city?",
        answer:
          "Delivery depends on outlet coverage and courier availability. If your area is not covered yet, our team can help check manual alternatives."
      },
      {
        category: "other",
        question: "How should I store Sushi Cake?",
        answer:
          "Keep it refrigerated and enjoy it chilled so the texture and flavor stay at their best. For the best experience, enjoy it on the same day."
      }
    ],
    contactTitle: "Still have",
    contactAccent: "questions?",
    contactLead: "The Street Sushi team is ready to help you every day.",
    whatsappLabel: "Chat via WhatsApp",
    instagramLabel: "DM Instagram",
    hoursLabel: "Operating Hours",
    hoursValue: "11.00 AM - 09.00 PM WIB",
    contactButton: "Contact Us",
    storageTitle: "Storage Tips",
    storageBody: "Keep it refrigerated and enjoy it chilled for the best flavor.",
    bottomTitle: "Order Sushi Cake at least D-2",
    bottomBody: "So your order can be prepared fresh and delivered right on time.",
    bottomButton: "See How to Order"
  }
};

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8 10l4 4 4-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ContactIcon({ type }) {
  if (type === "whatsapp") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 3.2a8.73 8.73 0 0 0-7.55 13.11L3.2 20.8l4.61-1.21A8.8 8.8 0 1 0 12 3.2Zm0 15.96a7.17 7.17 0 0 1-3.64-1l-.26-.15-2.74.72.73-2.67-.17-.28A7.22 7.22 0 1 1 12 19.16Zm3.95-5.43c-.22-.11-1.28-.63-1.47-.7-.2-.07-.34-.11-.49.11-.15.22-.56.7-.7.84-.13.15-.25.16-.47.06-.22-.11-.92-.34-1.76-1.08-.65-.58-1.1-1.3-1.23-1.52-.13-.22-.01-.34.1-.45.1-.1.22-.26.33-.39.11-.13.15-.22.22-.37.07-.15.04-.28-.02-.39-.06-.11-.49-1.18-.67-1.62-.17-.42-.35-.36-.49-.36h-.42c-.15 0-.39.06-.59.28-.2.22-.77.75-.77 1.83 0 1.08.79 2.13.9 2.28.11.15 1.56 2.38 3.77 3.34.53.23.94.37 1.26.47.53.17 1 .14 1.38.09.42-.06 1.28-.52 1.46-1.03.18-.51.18-.94.13-1.03-.06-.09-.2-.15-.42-.26Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (type === "instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm0 2.2A1.8 1.8 0 0 0 5.2 7v10A1.8 1.8 0 0 0 7 18.8h10a1.8 1.8 0 0 0 1.8-1.8V7A1.8 1.8 0 0 0 17 5.2H7Zm10.55 1.55a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6ZM12 7.2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6Zm0 2.2a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (type === "clock") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 0 0 0-17Zm.9 4.2v4.05l2.85 1.7"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 4.5v15m7.5-7.5h-15"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function FaqPage() {
  const { language } = useStoreLanguage();
  const copy = faqContent[language] || faqContent.id;
  const [activeCategory, setActiveCategory] = useState("all");
  const [openQuestion, setOpenQuestion] = useState(0);

  const filteredFaqs = useMemo(() => {
    if (activeCategory === "all") {
      return copy.faqs;
    }
    return copy.faqs.filter((item) => item.category === activeCategory);
  }, [activeCategory, copy.faqs]);

  return (
    <>
      <Head>
        <title>{language === "en" ? "FAQ | Street Sushi" : "FAQ | Street Sushi"}</title>
      </Head>

      <main className={styles.pageShell}>
        <div className={styles.canvas}>
          <StoreHeader />

          <section className={styles.hero}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>{copy.heroEyebrow}</p>
              <h1>
                {copy.heroTitle} <span>{copy.heroAccent}</span>
              </h1>
              <p>{copy.heroLead}</p>
            </div>

            <div className={styles.heroImageWrap}>
              <img src="/faq-banner.png" alt="Street Sushi FAQ banner" className={styles.heroImage} />
            </div>
          </section>

          <section className={styles.contentGrid}>
            <div className={styles.leftColumn}>
              <div className={styles.categoryRow}>
                {copy.categories.map((category) => (
                  <button
                    key={category.key}
                    type="button"
                    className={`${styles.categoryChip} ${
                      activeCategory === category.key ? styles.categoryChipActive : ""
                    }`}
                    onClick={() => {
                      setActiveCategory(category.key);
                      setOpenQuestion(0);
                    }}
                  >
                    <span>{category.icon}</span>
                    {category.label}
                  </button>
                ))}
              </div>

              <div className={styles.faqList}>
                {filteredFaqs.map((item, index) => {
                  const isOpen = openQuestion === index;
                  return (
                    <article key={`${item.category}-${item.question}`} className={styles.faqItem}>
                      <button
                        type="button"
                        className={styles.faqQuestion}
                        onClick={() => setOpenQuestion(isOpen ? -1 : index)}
                        aria-expanded={isOpen}
                      >
                        <span>{item.question}</span>
                        <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}>
                          <ChevronIcon />
                        </span>
                      </button>

                      {isOpen ? <div className={styles.faqAnswer}>{item.answer}</div> : null}
                    </article>
                  );
                })}
              </div>
            </div>

            <aside className={styles.sidebar}>
              <section className={styles.contactCard}>
                <h2>
                  {copy.contactTitle} <span>{copy.contactAccent}</span>
                </h2>
                <p>{copy.contactLead}</p>

                <a
                  href="https://example.com/contact/"
                  target="_blank"
                  rel="noreferrer"
                  className={styles.contactLink}
                >
                  <span className={styles.contactIcon}><ContactIcon type="whatsapp" /></span>
                  <span>
                    <strong>{copy.whatsappLabel}</strong>
                    <small>555-0199</small>
                  </span>
                  <span className={styles.contactArrow}>›</span>
                </a>

                <a
                  href="https://example.com/social"
                  target="_blank"
                  rel="noreferrer"
                  className={styles.contactLink}
                >
                  <span className={`${styles.contactIcon} ${styles.instagramIcon}`}>
                    <ContactIcon type="instagram" />
                  </span>
                  <span>
                    <strong>{copy.instagramLabel}</strong>
                    <small>@demo-store</small>
                  </span>
                  <span className={styles.contactArrow}>›</span>
                </a>

                <div className={styles.contactLink}>
                  <span className={styles.contactIcon}><ContactIcon type="clock" /></span>
                  <span>
                    <strong>{copy.hoursLabel}</strong>
                    <small>{copy.hoursValue}</small>
                  </span>
                  <span className={styles.contactArrow}>›</span>
                </div>

                <a
                  href="https://example.com/contact/"
                  target="_blank"
                  rel="noreferrer"
                  className={styles.contactButton}
                >
                  {copy.contactButton}
                </a>
              </section>

              <section className={styles.tipCard}>
                <div className={styles.tipIcon}>💡</div>
                <div>
                  <h3>{copy.storageTitle}</h3>
                  <p>{copy.storageBody}</p>
                </div>
                <span className={styles.contactArrow}>›</span>
              </section>
            </aside>
          </section>

          <section className={styles.bottomBar}>
            <div className={styles.bottomInfo}>
              <span className={styles.bottomIcon}>🗓</span>
              <div>
                <strong>{copy.bottomTitle}</strong>
                <p>{copy.bottomBody}</p>
              </div>
            </div>

            <Link href="/cara-pesan" className={styles.bottomButton}>
              {copy.bottomButton}
              <span>›</span>
            </Link>
          </section>
        </div>
      </main>
    </>
  );
}
