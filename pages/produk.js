import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import StoreHeader from "@/components/StoreHeader";
import { useCart } from "@/lib/cart-context";
import { listProductCategories } from "@/lib/category-store";
import { formatRupiah } from "@/lib/formatters";
import { getProducts } from "@/lib/product-store";
import { getLocalizedProduct, useStoreLanguage } from "@/lib/store-language";
import styles from "@/styles/Home.module.css";

function slugifyCategory(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getCategoryIcon(slug) {
  const key = String(slug || "").toLowerCase();
  if (key.includes("sushi-cake")) return "🍣";
  if (key.includes("hamper")) return "🎁";
  if (key.includes("platter")) return "🍱";
  if (key.includes("rame")) return "👨‍👩‍👧‍👦";
  if (key.includes("meeting")) return "💼";
  return "✨";
}

function getCategoryOrder(slug) {
  const order = {
    "sushi-cake": 1,
    platters: 2,
    "paket-ramean": 3,
    hampers: 4
  };

  return order[String(slug || "").toLowerCase()] || 99;
}

export default function ProductCatalogPage({ products, categories }) {
  const router = useRouter();
  const { language } = useStoreLanguage();
  const { addItem } = useCart();

  const activeCategory = String(router.query.category || "all").toLowerCase();
  const orderedCategories = categories
    .slice()
    .sort((a, b) => getCategoryOrder(a.slug) - getCategoryOrder(b.slug));
  const localizedProducts = products.map((product) => getLocalizedProduct(product, language));
  const visibleProducts =
    activeCategory === "all"
      ? localizedProducts
      : localizedProducts.filter((product) => slugifyCategory(product.category) === activeCategory);

  return (
    <>
      <Head>
        <title>{language === "en" ? "Products & Packages | Street Sushi" : "Produk & Paket | Street Sushi"}</title>
        <meta
          name="description"
          content={
            language === "en"
              ? "Browse Street Sushi products and packages by category."
              : "Jelajahi produk dan paket Street Sushi berdasarkan kategori."
          }
        />
      </Head>

      <main className={styles.pageShell}>
        <div className={styles.canvas}>
          <StoreHeader />

          <section className={styles.catalogHub}>
            <div className={styles.catalogCategoryRail}>
              <Link
                href="/produk"
                className={`${styles.catalogCategoryItem} ${
                  activeCategory === "all" ? styles.catalogCategoryItemActive : ""
                }`}
              >
                <span className={styles.catalogCategoryIcon}>✨</span>
                <span>{language === "en" ? "All" : "Semua"}</span>
              </Link>

              {orderedCategories.map((category) => {
                const isActive = activeCategory === category.slug;
                return (
                  <Link
                    key={category.id}
                    href={{ pathname: "/produk", query: { category: category.slug } }}
                    className={`${styles.catalogCategoryItem} ${
                      isActive ? styles.catalogCategoryItemActive : ""
                    }`}
                  >
                    <span className={styles.catalogCategoryIcon}>{getCategoryIcon(category.slug)}</span>
                    <span>{category.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className={styles.catalogProductGrid}>
              {visibleProducts.map((product) => (
                <article key={product.id} className={styles.catalogProductCard}>
                  <div className={styles.catalogProductBadge}>{product.category}</div>
                  <div className={styles.catalogProductImageWrap}>
                    {product.coverImageUrl ? (
                      <img
                        src={product.coverImageUrl}
                        alt={product.name}
                        className={styles.catalogProductImage}
                      />
                    ) : (
                      <div className={styles.productImageFallback} data-theme={product.theme} />
                    )}
                  </div>

                  <div className={styles.catalogProductBody}>
                    <h3>{product.name}</h3>
                    <p className={styles.catalogProductMeta}>
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M16.5 11a3.5 3.5 0 1 0-2.64-5.8A4.5 4.5 0 1 0 9 12a4.98 4.98 0 0 0-4.58 3.02A1.5 1.5 0 0 0 5.8 17h11.4a1.5 1.5 0 0 0 1.38-1.98A4.98 4.98 0 0 0 14 12c.95 0 1.84-.27 2.6-.74.55.45 1.25.74 2.02.74a3.38 3.38 0 0 0 1.86-.55A3.99 3.99 0 0 1 22 15a1 1 0 0 1-1 1h-1.25"
                          fill="currentColor"
                        />
                      </svg>
                      <span>{product.serves}</span>
                    </p>
                    <p className={styles.catalogProductPrice}>{formatRupiah(product.price)}</p>

                    <div className={styles.catalogProductActions}>
                      <Link href={`/product/${product.id}`} className={styles.catalogDetailAction}>
                        <span>{language === "en" ? "View Detail" : "Lihat Detail"}</span>
                        <span className={styles.catalogArrow}>›</span>
                      </Link>
                      <button
                        type="button"
                        className={styles.catalogAddButton}
                        onClick={() => addItem(product.id, 1, "", { productName: product.name })}
                        aria-label={language === "en" ? `Add ${product.name} to cart` : `Tambah ${product.name} ke keranjang`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </article>
              ))}

              {!visibleProducts.length ? (
                <article className={styles.productCardEmpty}>
                  <h3>{language === "en" ? "No products yet" : "Belum ada produk"}</h3>
                  <p>
                    {language === "en"
                      ? "This category is still being prepared."
                      : "Kategori ini masih sedang disiapkan."}
                  </p>
                </article>
              ) : null}
            </div>

            <div className={styles.catalogFooterStrip}>
              <div className={styles.catalogFooterItem}>
                <span className={styles.catalogFooterIcon}>
                  <img src="/footer-calendar.png" alt="" />
                </span>
                <div>
                  <strong>{language === "en" ? "Order H-1 in app" : "Pesan H-1 di app"}</strong>
                  <span>
                    {language === "en"
                      ? "For a smoother experience."
                      : "Untuk pengalaman terbaik."}
                  </span>
                </div>
              </div>
              <div className={styles.catalogFooterItem}>
                <span className={styles.catalogFooterIcon}>
                  <img src="/footer-delivery.png" alt="" />
                </span>
                <div>
                  <strong>
                    {language === "en" ? "Scheduled delivery" : "Pengiriman terjadwal"}
                  </strong>
                  <span>
                    {language === "en"
                      ? "Choose the timing that fits best."
                      : "Pilih waktu yang paling pas."}
                  </span>
                </div>
              </div>
              <a
                href="https://example.com/contact/"
                target="_blank"
                rel="noreferrer"
                className={styles.catalogFooterWhatsApp}
              >
                <span className={styles.catalogFooterIcon}>
                  <img src="/footer-whatsapp.png" alt="" />
                </span>
                <div>
                  <strong>
                    {language === "en" ? "Need it fast? Chat WhatsApp." : "Butuh cepat? Chat WhatsApp."}
                  </strong>
                  <span>
                    {language === "en" ? "Our team is ready to help." : "Tim kami siap bantu."}
                  </span>
                </div>
              </a>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export async function getServerSideProps() {
  const [products, categories] = await Promise.all([getProducts(), listProductCategories()]);
  return {
    props: {
      products,
      categories
    }
  };
}
