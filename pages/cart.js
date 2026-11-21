import Head from "next/head";
import Link from "next/link";
import StoreHeader from "@/components/StoreHeader";
import { useCart } from "@/lib/cart-context";
import { formatRupiah } from "@/lib/formatters";
import { useMember } from "@/lib/member-context";
import { getProducts } from "@/lib/product-store";
import { getLocalizedProduct, useStoreLanguage } from "@/lib/store-language";
import styles from "@/styles/Cart.module.css";

const noteOptions = [
  { value: "", key: "noNote" },
  { value: "Tidak pedas", key: "lessSpicy" }
];

export default function CartPage({ products }) {
  const { items, updateQuantity, updateNote, removeItem, itemCount } = useCart();
  const { member } = useMember();
  const { language, copy } = useStoreLanguage();
  const cartProducts = items
    .map((line) => {
      const product = products.find((entry) => entry.id === line.productId);
      return product
        ? { ...getLocalizedProduct(product, language), lineId: line.id, quantity: line.quantity, note: line.note || "" }
        : null;
    })
    .filter(Boolean);

  const subtotal = cartProducts.reduce(
    (total, product) => total + product.price * product.quantity,
    0
  );

  return (
    <>
      <Head>
        <title>{`${copy.cart} | Street Sushi`}</title>
      </Head>

      <main className={styles.pageShell}>
        <StoreHeader compact />

        <section className={styles.cartLayout}>
          <div className={styles.listPanel}>
            <h1>{copy.cartTitle}</h1>
            <p>{`${itemCount} ${copy.cartReady}`}</p>

            {!cartProducts.length && (
              <div className={styles.emptyState}>
                <p>{copy.cartEmpty}</p>
                <Link href="/" className={styles.secondaryButton}>
                  {copy.exploreCakes}
                </Link>
              </div>
            )}

            <div className={styles.cartList}>
              {cartProducts.map((product) => (
                <article key={product.lineId} className={styles.cartItem}>
                  {product.coverImageUrl ? (
                    <img src={product.coverImageUrl} alt={product.name} className={styles.cartThumb} />
                  ) : (
                    <div className={styles.cartThumbPlaceholder}>SS</div>
                  )}

                  <div className={styles.cartItemCopy}>
                    <strong>{product.name}</strong>
                    <span>
                      {formatRupiah(product.price)} • {product.serves}
                    </span>
                    <label className={styles.noteField}>
                      <span>{copy.itemNote}</span>
                      <select
                        value={product.note}
                        onChange={(event) => updateNote(product.lineId, event.target.value)}
                      >
                        {noteOptions.map((option) => (
                          <option key={option.key} value={option.value}>
                            {copy[option.key]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className={styles.quantityControl}>
                    <button type="button" onClick={() => updateQuantity(product.lineId, product.quantity - 1)}>
                      -
                    </button>
                    <span>{product.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(product.lineId, product.quantity + 1)}>
                      +
                    </button>
                  </div>

                  <button type="button" className={styles.removeButton} onClick={() => removeItem(product.lineId)}>
                    {copy.remove}
                  </button>
                </article>
              ))}
            </div>
          </div>

          <aside className={styles.summaryPanel}>
            <h2>{copy.orderSummary}</h2>
            <div className={styles.summaryRow}>
              <span>{copy.subtotal}</span>
              <strong>{formatRupiah(subtotal)}</strong>
            </div>
            <p className={styles.helper}>
              {copy.deliveryLater}
            </p>

            <Link
              href={
                cartProducts.length
                  ? member
                    ? "/checkout"
                    : "/member-login?next=/checkout"
                  : "/"
              }
              className={styles.primaryButton}
            >
              {copy.continueCheckout}
            </Link>
          </aside>
        </section>
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
