import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import StoreHeader from "@/components/StoreHeader";
import { useCart } from "@/lib/cart-context";
import { getProducts } from "@/lib/product-store";
import { formatRupiah } from "@/lib/formatters";
import { getLocalizedProduct, useStoreLanguage } from "@/lib/store-language";
import styles from "@/styles/Home.module.css";

function slugifyCategory(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function Home({ products }) {
  const router = useRouter();
  const { language, copy: t } = useStoreLanguage();
  const { addItem } = useCart();
  const metaDescription =
    language === "en"
      ? "Celebrate birthdays, office treats, and surprise moments with halal sushi cakes and curated gift sets from Street Sushi."
      : "Rayakan ulang tahun, traktiran kantor, dan momen spesial dengan sushi cake halal dan gift set pilihan dari Street Sushi.";
  const activeCategory = String(router.query.category || "").toLowerCase();
  const categoryProducts =
    activeCategory && activeCategory !== "all"
      ? products.filter((product) => slugifyCategory(product.category) === activeCategory)
      : products;
  const spotlightProduct =
    categoryProducts.find((product) => product.spotlight) ||
    categoryProducts.find((product) => product.featured) ||
    categoryProducts[0] ||
    null;
  const spotlight = spotlightProduct ? getLocalizedProduct(spotlightProduct, language) : null;
  const featuredProducts = categoryProducts.slice(0, 4);
  const isHampersView = activeCategory === "hampers";
  const heroHeading =
    isHampersView
      ? language === "en"
        ? {
            top: "Halal Hampers",
            bottom: "for gifting moments that feel extra thoughtful."
          }
        : {
            top: "Hampers halal",
            bottom: "untuk hadiah yang terasa lebih spesial."
          }
      : language === "en"
        ? {
            top: "Halal Sushi Cake",
            bottom: "for moments worth making extra special."
          }
        : {
            top: "Sushi Cake halal",
            bottom: "untuk momen yang lebih spesial."
          };
  const leadCopy = isHampersView
    ? language === "en"
      ? "Pick curated gifting boxes for birthdays, office treats, and thoughtful surprises. Practical, presentable, and easy to send."
      : "Pilih hampers yang siap dikirim untuk ulang tahun, hadiah kantor, dan kejutan yang lebih berkesan. Praktis, rapi, dan gampang dikirim."
    : language === "en"
      ? "Perfect for birthdays, office treats, and surprise parties. Starting from Rp 310.000, freshly made and ready to become the centerpiece your guests will remember."
      : "Cocok untuk ulang tahun, traktiran kantor, dan surprise party. Mulai dari Rp 310.000, fresh made, dan siap jadi centerpiece yang beda dari kue biasa.";
  const catalogTitle = isHampersView
    ? language === "en"
      ? "Pick Your Favorite Hampers"
      : "Pilih Hampers Favoritmu"
    : language === "en"
      ? "Pick Your Favorite Sushi Cake"
      : "Pilih Sushi Cake Favoritmu";

  return (
    <>
      <Head>
        <title>Street Sushi Shop</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content="Street Sushi Shop" />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:site_name" content="Street Sushi Shop" />
        <meta name="twitter:title" content="Street Sushi Shop" />
        <meta name="twitter:description" content={metaDescription} />
      </Head>

      <main id="top" className={styles.pageShell}>
        <div className={styles.canvas}>
          <StoreHeader />

          <section className={styles.hero}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>{t.shopLabel}</p>
              <h1 className={styles.heroTitle}>
                {heroHeading.top}
                <span>{heroHeading.bottom}</span>
              </h1>
              <p className={styles.lead}>{leadCopy}</p>

              <div className={styles.heroActions}>
                <Link href={spotlight ? `/product/${spotlight.id}` : "/#catalog"} className={styles.primaryAction}>
                  <span className={styles.actionIcon}>🍣</span>
                  <span>
                    {isHampersView
                      ? language === "en"
                        ? "Order Hampers"
                        : "Pesan Hampers"
                      : language === "en"
                        ? "Order Sushi Cake"
                        : "Pesan Sushi Cake"}
                  </span>
                  <span className={styles.actionArrow}>›</span>
                </Link>
                <Link href="/produk" className={styles.secondaryAction}>
                  <span>{language === "en" ? "See Menu & Pricing" : "Lihat Menu & Harga"}</span>
                  <span className={styles.actionArrow}>›</span>
                </Link>
              </div>

              <ul className={styles.featurePills}>
                {t.facts.map((fact, index) => (
                  <li key={fact}>
                    <span className={styles.featureIcon} aria-hidden="true">
                      {index === 0 ? "🛡️" : index === 1 ? "🛵" : "👥"}
                    </span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>

            <article className={styles.spotlightCard}>
              {spotlight ? (
                <>
              <div className={styles.spotlightTop}>
                <div>
                  <span className={styles.spotlightBadge}>{t.spotlight}</span>
                  <h2>{spotlight.name}</h2>
                  <p className={styles.spotlightTagline}>{spotlight.tagline}</p>
                  <div className={styles.priceRow}>
                    <strong>{formatRupiah(spotlight.price)}</strong>
                    <span className={styles.priceMeta}>
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M16.5 11a3.5 3.5 0 1 0-2.64-5.8A4.5 4.5 0 1 0 9 12a4.98 4.98 0 0 0-4.58 3.02A1.5 1.5 0 0 0 5.8 17h11.4a1.5 1.5 0 0 0 1.38-1.98A4.98 4.98 0 0 0 14 12c.95 0 1.84-.27 2.6-.74.55.45 1.25.74 2.02.74a3.38 3.38 0 0 0 1.86-.55A3.99 3.99 0 0 1 22 15a1 1 0 0 1-1 1h-1.25"
                          fill="currentColor"
                        />
                      </svg>
                      {spotlight.serves}
                    </span>
                  </div>
                </div>

                <div className={styles.piecesBadge}>
                  <strong>{spotlight.pieces}</strong>
                  <span>PCS</span>
                </div>
              </div>

              <div className={styles.spotlightImageFrame}>
                {spotlight.coverImageUrl ? (
                  <img
                    src={spotlight.coverImageUrl}
                    alt={spotlight.name}
                    className={styles.spotlightImage}
                  />
                ) : (
                  <div className={styles.spotlightImageFallback} data-theme={spotlight.theme} />
                )}
              </div>

              <p className={styles.spotlightDescription}>{spotlight.description}</p>

              <div className={styles.spotlightActions}>
                <Link href={`/product/${spotlight.id}`} className={styles.cardPrimaryAction}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M7 8V7a5 5 0 0 1 10 0v1h1.5A1.5 1.5 0 0 1 20 9.5v8A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-8A1.5 1.5 0 0 1 5.5 8H7Zm2 0h6V7a3 3 0 0 0-6 0v1Zm-2.75 2a.75.75 0 0 0-.75.75v6.75c0 .69.56 1.25 1.25 1.25h11c.69 0 1.25-.56 1.25-1.25v-6.75a.75.75 0 0 0-.75-.75H17v1.5a1 1 0 1 1-2 0V10H9v1.5a1 1 0 1 1-2 0V10H6.25Z"
                      fill="currentColor"
                    />
                  </svg>
                  {t.orderSoon}
                </Link>
                <button
                  type="button"
                  className={styles.cardSecondaryAction}
                  onClick={() => addItem(spotlight.id, 1, "", { productName: spotlight.name })}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M3.5 5.5h2.1a1 1 0 0 1 .96.72L7.2 8.5m0 0h12.05a1 1 0 0 1 .96 1.28l-1.48 5.18a1.5 1.5 0 0 1-1.44 1.09H9.28a1.5 1.5 0 0 1-1.45-1.12L7.2 8.5Zm0 0-.63-2.28M10 8.9v6.5m4.2-6.5v6.5m4.2-6.5-.8 6.5M8.1 12.2h11M9.3 19.4a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0Zm10 0a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0Z"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.7"
                    />
                  </svg>
                  {language === "en" ? "Add to Cart" : "Tambah ke Keranjang"}
                </button>
              </div>
                </>
              ) : (
                <div className={styles.emptyState}>
                  <span className={styles.spotlightBadge}>{t.spotlight}</span>
                  <h2>{isHampersView ? "Hampers" : "Street Sushi"}</h2>
                  <p className={styles.spotlightDescription}>
                    {language === "en"
                      ? "This category will be filled as soon as the products are ready to launch."
                      : "Kategori ini akan terisi begitu produknya siap ditampilkan."}
                  </p>
                </div>
              )}
            </article>
          </section>

          <section id="catalog" className={styles.catalogSection}>
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.sectionAccent} />
                <h2>{catalogTitle}</h2>
              </div>
              <Link href="/produk" className={styles.sectionLink}>
                <span>{language === "en" ? "View all menu" : "Lihat semua menu"}</span>
                <span className={styles.sectionLinkArrow}>›</span>
              </Link>
            </div>

            <div className={styles.productGrid}>
              {featuredProducts.length ? featuredProducts.map((product) => {
                const localizedProduct = getLocalizedProduct(product, language);

                return (
                  <article key={localizedProduct.id} className={styles.productCard}>
                    <div className={styles.productImageWrap}>
                      {localizedProduct.coverImageUrl ? (
                        <img
                          src={localizedProduct.coverImageUrl}
                          alt={localizedProduct.name}
                          className={styles.productImage}
                        />
                      ) : (
                        <div className={styles.productImageFallback} data-theme={localizedProduct.theme} />
                      )}
                    </div>

                    <div className={styles.productBody}>
                      <h3>{localizedProduct.name}</h3>
                      <p className={styles.productPrice}>{formatRupiah(localizedProduct.price)}</p>
                      <p className={styles.productMeta}>
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            d="M16.5 11a3.5 3.5 0 1 0-2.64-5.8A4.5 4.5 0 1 0 9 12a4.98 4.98 0 0 0-4.58 3.02A1.5 1.5 0 0 0 5.8 17h11.4a1.5 1.5 0 0 0 1.38-1.98A4.98 4.98 0 0 0 14 12c.95 0 1.84-.27 2.6-.74.55.45 1.25.74 2.02.74a3.38 3.38 0 0 0 1.86-.55A3.99 3.99 0 0 1 22 15a1 1 0 0 1-1 1h-1.25"
                            fill="currentColor"
                          />
                        </svg>
                        <span>{localizedProduct.serves}</span>
                      </p>
                      <p className={styles.productDescription}>{localizedProduct.description}</p>

                      <Link href={`/product/${localizedProduct.id}`} className={styles.productAction}>
                        <span>{language === "en" ? "View Detail" : "Lihat Detail"}</span>
                        <span className={styles.productActionArrow}>›</span>
                      </Link>
                    </div>
                  </article>
                );
              }) : (
                <article className={styles.productCardEmpty}>
                  <h3>{isHampersView ? "Hampers" : "Produk"}</h3>
                  <p>
                    {language === "en"
                      ? "No products are available in this category yet."
                      : "Belum ada produk yang tersedia di kategori ini."}
                  </p>
                </article>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export async function getServerSideProps() {
  const products = await getProducts();
  return {
    props: {
      products
    }
  };
}
