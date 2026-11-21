import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import StoreHeader from "@/components/StoreHeader";
import { useCart } from "@/lib/cart-context";
import { formatRupiah } from "@/lib/formatters";
import { getProducts } from "@/lib/product-store";
import { getLocalizedProduct, useStoreLanguage } from "@/lib/store-language";
import styles from "@/styles/ProductDetail.module.css";

const noteOptions = [
  { value: "", key: "noNote" },
  { value: "Tidak pedas", key: "lessSpicy" }
];

export default function ProductDetailPage({ product, outlets }) {
  const { addItem } = useCart();
  const { language, copy } = useStoreLanguage();
  const [message, setMessage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const localizedProduct = getLocalizedProduct(product, language);
  const restrictedOutletSlugs = Array.isArray(product.availableOutletSlugs)
    ? product.availableOutletSlugs.filter(Boolean)
    : [];
  const availableOutletNames = (outlets || [])
    .filter((outlet) => {
      if (!restrictedOutletSlugs.length) return true;
      return restrictedOutletSlugs.includes(outlet.slug);
    })
    .map((outlet) => outlet.shortLabel || outlet.name);
  const showOutletAvailability = restrictedOutletSlugs.length > 0;

  function handleAddToCart() {
    addItem(product.id, quantity, note, { productName: localizedProduct.name });
    setMessage(`${localizedProduct.name} ${copy.addedToCart}`);
  }

  return (
    <>
      <Head>
        <title>{`${localizedProduct.name} | Street Sushi`}</title>
      </Head>

      <main className={styles.pageShell}>
        <StoreHeader compact />

        <section className={styles.detailLayout}>
          <div className={styles.mediaPanel}>
            {localizedProduct.coverImageUrl ? (
              <img
                src={localizedProduct.coverImageUrl}
                alt={localizedProduct.name}
                className={styles.coverImage}
              />
            ) : (
              <div className={styles.placeholder}>Street Sushi</div>
            )}

            {!!localizedProduct.imageUrls?.length && (
              <div className={styles.galleryRow}>
                {localizedProduct.imageUrls.map((url) => (
                  <img key={url} src={url} alt={localizedProduct.name} className={styles.thumb} />
                ))}
              </div>
            )}
          </div>

          <div className={styles.copyPanel}>
            <p className={styles.eyebrow}>{copy.productLabel}</p>
            <h1>{localizedProduct.name}</h1>
            <p className={styles.tagline}>{localizedProduct.tagline}</p>
            <p className={styles.description}>{localizedProduct.description}</p>
            {showOutletAvailability && availableOutletNames.length ? (
              <p className={styles.availableOutletList}>
                {copy.availableAt}: {availableOutletNames.join(", ")}
              </p>
            ) : null}

            <div className={styles.priceBlock}>
              <strong>{formatRupiah(localizedProduct.price)}</strong>
              <span>
                {localizedProduct.pieces} pcs • {localizedProduct.serves}
              </span>
            </div>

            <ul className={styles.itemList}>
              {localizedProduct.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className={styles.quantityRow}>
              <span>{copy.quantity}</span>
              <div className={styles.quantityControl}>
                <button
                  type="button"
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                >
                  -
                </button>
                <span>{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((current) => current + 1)}
                >
                  +
                </button>
              </div>
            </div>

            <label className={styles.noteField}>
              <span>{copy.itemNote}</span>
              <select value={note} onChange={(event) => setNote(event.target.value)}>
                {noteOptions.map((option) => (
                  <option key={option.key} value={option.value}>
                    {copy[option.key]}
                  </option>
                ))}
              </select>
            </label>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleAddToCart}
              >
                {copy.addToCart}
              </button>
              <Link href="/cart" className={styles.secondaryButton}>
                {copy.viewCart}
              </Link>
            </div>

            {message && <p className={styles.notice}>{message}</p>}
          </div>
        </section>
      </main>
    </>
  );
}

export async function getServerSideProps({ params }) {
  const products = await getProducts();
  const { listOutlets } = await import("@/lib/outlet-store");
  const outlets = await listOutlets();
  const product = products.find((entry) => entry.id === params.slug);

  if (!product) {
    return {
      notFound: true
    };
  }

  return {
    props: {
      product,
      outlets
    }
  };
}
