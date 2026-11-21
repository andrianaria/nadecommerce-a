import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import StoreHeader from "@/components/StoreHeader";
import { useCart } from "@/lib/cart-context";
import { formatRupiah } from "@/lib/formatters";
import { useMember } from "@/lib/member-context";
import { filterOutletsForProducts } from "@/lib/product-availability";
import { getDeliveryTimeOptions } from "@/lib/outlets";
import { listOutlets } from "@/lib/outlet-store";
import { getProducts } from "@/lib/product-store";
import { getLocalizedProduct, useStoreLanguage } from "@/lib/store-language";
import { buildJakartaScheduleAt } from "@/lib/jakarta-time";
import GoogleAddressPicker from "@/components/checkout/GoogleAddressPicker";
import styles from "@/styles/Checkout.module.css";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getMinimumDeliveryDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function getDefaultOutlet(outlets) {
  return outlets[0] || null;
}

function getOutletBySlug(outlets, slug) {
  return outlets.find((outlet) => outlet.slug === slug) || getDefaultOutlet(outlets);
}

function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function findNearestOutlet(outlets, lat, lng) {
  const activeOutlets = outlets.filter((outlet) => outlet.isActive !== false);
  const candidates = activeOutlets.length ? activeOutlets : outlets;
  const withCoords = candidates.filter((outlet) => outlet.latitude != null && outlet.longitude != null);

  if (!withCoords.length) {
    return getDefaultOutlet(candidates);
  }

  let best = withCoords[0];
  let bestDistance = Infinity;

  for (const outlet of withCoords) {
    const distance = haversineDistanceKm(
      lat,
      lng,
      Number(outlet.latitude),
      Number(outlet.longitude)
    );
    if (distance < bestDistance) {
      bestDistance = distance;
      best = outlet;
    }
  }

  return best;
}

function findBestOutlet(outlets, address = "") {
  const haystack = String(address || "").toLowerCase().trim();
  const activeOutlets = outlets.filter((outlet) => outlet.isActive !== false);
  const fallbackOutlet = getDefaultOutlet(activeOutlets.length ? activeOutlets : outlets);

  if (!fallbackOutlet || !haystack) {
    return fallbackOutlet;
  }

  let bestOutlet = fallbackOutlet;
  let bestScore = -1;

  for (const outlet of activeOutlets) {
    const score = (outlet.keywords || []).reduce((total, keyword) => {
      return total + (haystack.includes(String(keyword).toLowerCase()) ? 1 : 0);
    }, 0);

    if (score > bestScore) {
      bestOutlet = outlet;
      bestScore = score;
    }
  }

  return bestOutlet;
}

function formatVehicleServiceType(serviceType, language) {
  const normalized = String(serviceType || "").toUpperCase();
  if (normalized === "VAN") return "Van";
  if (normalized === "MPV") return "MPV";
  if (normalized === "MOTORCYCLE") return language === "en" ? "Motorcycle" : "Motor";
  return normalized || "-";
}

export default function CheckoutPage({ products, outlets }) {
  const router = useRouter();
  const defaultOutlet = useMemo(() => getDefaultOutlet(outlets), [outlets]);
  const { items, clearCart } = useCart();
  const { member, loading: memberLoading } = useMember();
  const { language, copy } = useStoreLanguage();
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    recipientName: "",
    deliveryAddress: "",
    deliveryAddressDetail: "",
    deliveryLat: null,
    deliveryLng: null,
    deliveryPlaceId: "",
    recipientPhone: "",
    cardMessage: "",
    fulfillmentType: "delivery",
    outletSlug: defaultOutlet?.slug || "",
    deliveryDate: getMinimumDeliveryDate(),
    deliveryTime: "12:00",
    notes: ""
  });
  const [shipping, setShipping] = useState({
    fee: 0,
    baseFee: 0,
    markupAmount: 0,
    markupPercent: 15,
    serviceType: "MOTORCYCLE",
    loading: false,
    error: "",
    lastKey: ""
  });
  const [promoCode, setPromoCode] = useState("");
  const [promoState, setPromoState] = useState({
    loading: false,
    error: "",
    message: "",
    discountAmount: 0,
    promotion: null
  });
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOutletManual, setIsOutletManual] = useState(false);

  const cartProducts = useMemo(
    () =>
      items
        .map((line) => {
          const product = products.find((entry) => entry.id === line.productId);
          return product
            ? {
                ...getLocalizedProduct(product, language),
                lineId: line.id,
                quantity: line.quantity,
                note: line.note || ""
              }
            : null;
        })
        .filter(Boolean),
    [items, language, products]
  );
  const eligibleOutlets = useMemo(
    () => filterOutletsForProducts(outlets, cartProducts),
    [outlets, cartProducts]
  );
  const noEligibleOutlet = cartProducts.length > 0 && eligibleOutlets.length === 0;

  const subtotal = cartProducts.reduce(
    (total, product) => total + product.price * product.quantity,
    0
  );
  const promoDiscount = Number(promoState.discountAmount || 0);
  const discountedSubtotal = Math.max(0, subtotal - promoDiscount);
  const total = discountedSubtotal + Number(shipping.fee || 0);
  const selectedOutlet = getOutletBySlug(eligibleOutlets, form.outletSlug);
  const deliveryTimes = getDeliveryTimeOptions();
  const minimumDeliveryDate = getMinimumDeliveryDate();

  const whatsappHref = useMemo(() => {
    const infoLines = [
      form.customerName
        ? `${language === "en" ? "Orderer name" : "Nama pemesan"}: ${form.customerName}`
        : null,
      form.customerPhone
        ? `${language === "en" ? "Orderer phone" : "Nomor pemesan"}: ${form.customerPhone}`
        : null,
      form.customerEmail ? `Email: ${form.customerEmail}` : null,
      form.recipientName
        ? `${language === "en" ? "Recipient name" : "Nama penerima"}: ${form.recipientName}`
        : null,
      form.recipientPhone
        ? `${language === "en" ? "Recipient phone" : "Nomor penerima"}: ${form.recipientPhone}`
        : null
    ].filter(Boolean);

    const itemLines = cartProducts.map(
      (product) =>
        `- ${product.name} x ${product.quantity}${product.note ? ` • ${product.note}` : ""} (${formatRupiah(product.price * product.quantity)})`
    );

    const lines = [
      copy.asapPrefix,
      ...(infoLines.length ? ["", ...infoLines] : []),
      ...(itemLines.length ? ["", copy.whatsappOrderLabel, ...itemLines] : []),
      "",
      `${copy.total}: ${formatRupiah(total)}`
    ];

    return `https://example.com/contact/?text=${encodeURIComponent(lines.join("\n"))}`;
  }, [copy, form, cartProducts, total]);

  useEffect(() => {
    if (memberLoading) {
      return;
    }

    if (!member) {
      router.replace(`/member-login?next=${encodeURIComponent("/checkout")}`);
    }
  }, [member, memberLoading, router]);

  function updateField(event) {
    const { name, value } = event.target;

    if (name === "outletSlug") {
      setIsOutletManual(true);
    }

    setForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  useEffect(() => {
    if (!member) {
      return;
    }

    setForm((current) => ({
      ...current,
      customerName: current.customerName || member.fullName || "",
      customerPhone: current.customerPhone || member.phone || "",
      customerEmail: current.customerEmail || member.email || ""
    }));
  }, [member]);

  useEffect(() => {
    if (isOutletManual && form.fulfillmentType === "delivery") {
      return;
    }

    const hasCoords =
      typeof form.deliveryLat === "number" && typeof form.deliveryLng === "number";
    const nextOutlet = hasCoords
      ? findNearestOutlet(eligibleOutlets, form.deliveryLat, form.deliveryLng)
      : findBestOutlet(eligibleOutlets, form.deliveryAddress);

    if (!nextOutlet) {
      return;
    }

    setForm((current) => ({
      ...current,
      outletSlug: nextOutlet.slug
    }));
  }, [
    form.deliveryAddress,
    form.deliveryLat,
    form.deliveryLng,
    form.fulfillmentType,
    isOutletManual,
    eligibleOutlets
  ]);

  useEffect(() => {
    const firstEligible = getDefaultOutlet(eligibleOutlets);
    if (!firstEligible) {
      setForm((current) => ({
        ...current,
        outletSlug: ""
      }));
      return;
    }

    setForm((current) => {
      if (current.outletSlug && eligibleOutlets.some((outlet) => outlet.slug === current.outletSlug)) {
        return current;
      }

      return {
        ...current,
        outletSlug: firstEligible.slug
      };
    });
  }, [defaultOutlet, eligibleOutlets]);

  useEffect(() => {
    if (form.deliveryDate >= minimumDeliveryDate) {
      return;
    }

    setForm((current) => ({
      ...current,
      deliveryDate: minimumDeliveryDate
    }));
  }, [form.deliveryDate, minimumDeliveryDate]);

  useEffect(() => {
    if (!cartProducts.length || !form.outletSlug) {
      setPromoState({
        loading: false,
        error: "",
        message: "",
        discountAmount: 0,
        promotion: null
      });
      return;
    }

    const timer = setTimeout(async () => {
      setPromoState((current) => ({
        ...current,
        loading: true,
        error: "",
        message: current.promotion ? current.message : ""
      }));

      try {
        const response = await fetch("/api/promotions/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: promoCode,
            outletSlug: form.outletSlug,
            language,
            items: cartProducts.map((product) => ({
              productId: product.id,
              quantity: product.quantity,
              note: product.note || ""
            }))
          })
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || copy.promoInvalid);
        }

        setPromoState({
          loading: false,
          error: "",
          message: data.message || "",
          discountAmount: Number(data.discountAmount || 0),
          promotion: data.promotion || null
        });
      } catch (error) {
        setPromoState({
          loading: false,
          error: promoCode ? error.message || copy.promoInvalid : "",
          message: "",
          discountAmount: 0,
          promotion: null
        });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [cartProducts, copy.promoInvalid, form.outletSlug, language, promoCode]);

  useEffect(() => {
    if (form.fulfillmentType !== "delivery") {
      setShipping((s) => ({
        ...s,
        fee: 0,
        baseFee: 0,
        markupAmount: 0,
        serviceType: "MOTORCYCLE",
        loading: false,
        error: "",
        lastKey: ""
      }));
      return;
    }

    const pickupReady =
      selectedOutlet &&
      selectedOutlet.latitude != null &&
      selectedOutlet.longitude != null &&
      selectedOutlet.address;
    const dropReady =
      typeof form.deliveryLat === "number" &&
      typeof form.deliveryLng === "number" &&
      form.deliveryAddress;

    if (!pickupReady || !dropReady) {
      return;
    }

    const scheduleAt = buildJakartaScheduleAt(form.deliveryDate, form.deliveryTime);
    const itemSignature = cartProducts
      .map((product) => `${product.id}:${product.quantity}`)
      .sort()
      .join(",");
    const quoteKey = [
      selectedOutlet.slug,
      Number(form.deliveryLat).toFixed(5),
      Number(form.deliveryLng).toFixed(5),
      form.deliveryDate,
      form.deliveryTime,
      itemSignature
    ].join("|");

    if (shipping.lastKey === quoteKey) {
      return;
    }

    const t = setTimeout(async () => {
      setShipping((s) => ({ ...s, loading: true, error: "", lastKey: quoteKey }));

      try {
        const response = await fetch("/api/delivery/lalamove/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scheduleAt,
            stops: [
              {
                coordinates: {
                  lat: Number(selectedOutlet.latitude),
                  lng: Number(selectedOutlet.longitude)
                },
                address: selectedOutlet.address
              },
              {
                coordinates: {
                  lat: Number(form.deliveryLat),
                  lng: Number(form.deliveryLng)
                },
                address: form.deliveryAddress
              }
            ],
            items: cartProducts.map((product) => ({
              productId: product.id,
              quantity: product.quantity
            }))
          })
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "Gagal menghitung ongkir.");
        }

        const quote = data.quote || {};
        const breakdown = quote?.data?.priceBreakdown || quote.priceBreakdown || {};
        const baseFee = Number(data.baseFee ?? breakdown.total ?? 0);
        const customerFee = Number(data.customerFee ?? baseFee);
        const markupAmount = Number(data.markupAmount ?? Math.max(0, customerFee - baseFee));
        const markupPercent = Number(data.markupPercent ?? 15);
        setShipping((s) => ({
          ...s,
          fee: Number.isFinite(customerFee) ? customerFee : 0,
          baseFee: Number.isFinite(baseFee) ? baseFee : 0,
          markupAmount: Number.isFinite(markupAmount) ? markupAmount : 0,
          markupPercent: Number.isFinite(markupPercent) ? markupPercent : 15,
          serviceType: data.serviceType || "MOTORCYCLE",
          loading: false,
          error: ""
        }));
      } catch (error) {
        setShipping((s) => ({ ...s, loading: false, error: error.message || "Gagal menghitung ongkir." }));
      }
    }, 650);

    return () => clearTimeout(t);
  }, [
    form.deliveryAddress,
    form.deliveryLat,
    form.deliveryLng,
    form.deliveryDate,
    form.deliveryTime,
    form.fulfillmentType,
    cartProducts,
    selectedOutlet,
    shipping.lastKey
  ]);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(copy.creatingCheckout);

    try {
      if (noEligibleOutlet) {
        throw new Error(copy.noEligibleOutlet);
      }

      if (
        form.fulfillmentType === "delivery" &&
        (typeof form.deliveryLat !== "number" || typeof form.deliveryLng !== "number")
      ) {
        throw new Error(copy.locationPinRequired);
      }

      if (form.fulfillmentType === "delivery" && (!Number.isFinite(shipping.fee) || Number(shipping.fee) <= 0)) {
        throw new Error(copy.deliveryQuoteRequired);
      }

      const response = await fetch("/api/checkout/xendit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...form,
          language,
          outletId: undefined,
          items: cartProducts.map((product) => ({
            productId: product.id,
            quantity: product.quantity,
            note: product.note || ""
          })),
          promotionCode: promoCode,
          deliveryFee: form.fulfillmentType === "delivery" ? Number(shipping.fee || 0) : 0,
          deliveryBaseFee: form.fulfillmentType === "delivery" ? Number(shipping.baseFee || 0) : 0,
          deliveryMarkupAmount:
            form.fulfillmentType === "delivery" ? Number(shipping.markupAmount || 0) : 0,
          deliveryMarkupPercent:
            form.fulfillmentType === "delivery" ? Number(shipping.markupPercent || 0) : 0,
          deliveryServiceType:
            form.fulfillmentType === "delivery" ? String(shipping.serviceType || "MOTORCYCLE") : null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || copy.checkoutFailed);
      }

      setStatus(`Order ${data.orderReference} ${copy.checkoutSuccess}`);
      clearCart();

      if (data.payment?.checkoutUrl) {
        window.location.href = data.payment.checkoutUrl;
        return;
      }
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (memberLoading || !member) {
    return (
      <>
        <Head>
          <title>{`${copy.checkoutTitle} | Street Sushi`}</title>
        </Head>
        <main className={styles.pageShell}>
          <StoreHeader compact />
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{`${copy.checkoutTitle} | Street Sushi`}</title>
      </Head>

      <main className={styles.pageShell}>
        <StoreHeader compact />

        <section className={styles.checkoutLayout}>
          <form className={styles.formPanel} onSubmit={handleSubmit}>
            <h1>{copy.checkoutTitle}</h1>
            <p className={styles.formStatus}>{status}</p>

            <label>
              {copy.ordererName}
              <input
                name="customerName"
                value={form.customerName}
                onChange={updateField}
                required
              />
            </label>

            <label>
              {copy.ordererPhone}
              <input
                name="customerPhone"
                value={form.customerPhone}
                onChange={updateField}
                required
              />
            </label>

            <label>
              {copy.email}
              <input
                type="email"
                name="customerEmail"
                value={form.customerEmail}
                onChange={updateField}
              />
            </label>

            <label>
              {copy.recipientName}
              <input
                name="recipientName"
                value={form.recipientName}
                onChange={updateField}
                required
              />
            </label>

            <label>
              {copy.recipientPhone}
              <input
                name="recipientPhone"
                value={form.recipientPhone}
                onChange={updateField}
                required
              />
            </label>

            <label>
              {copy.fulfillmentType}
              <select
                name="fulfillmentType"
                value={form.fulfillmentType}
                onChange={(event) => {
                  setIsOutletManual(false);
                  updateField(event);
                }}
              >
                <option value="delivery">{copy.delivery}</option>
                <option value="pickup">{copy.pickup}</option>
              </select>
            </label>

            <label>
              {copy.deliveryAddress}
              <GoogleAddressPicker
                apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                value={form.deliveryAddress}
                onChange={(next) =>
                  setForm((current) => ({
                    ...current,
                    deliveryAddress: next
                  }))
                }
                lat={form.deliveryLat}
                lng={form.deliveryLng}
                onCoordsChange={(nextLat, nextLng) =>
                  setForm((current) => ({
                    ...current,
                    deliveryLat: nextLat,
                    deliveryLng: nextLng
                  }))
                }
                onPlaceIdChange={(placeId) =>
                  setForm((current) => ({
                    ...current,
                    deliveryPlaceId: placeId
                  }))
                }
                required={form.fulfillmentType === "delivery"}
                disabled={form.fulfillmentType !== "delivery"}
                helper={copy.mapHelper}
              />
            </label>

            <label>
              {copy.deliveryAddressDetail}
              <textarea
                name="deliveryAddressDetail"
                rows="3"
                value={form.deliveryAddressDetail}
                onChange={updateField}
                placeholder={copy.deliveryAddressDetailPlaceholder}
                required={form.fulfillmentType === "delivery"}
                disabled={form.fulfillmentType !== "delivery"}
              />
              <span className={styles.fieldHelper}>{copy.deliveryAddressDetailHelper}</span>
            </label>

            <label>
              {copy.outlet}
              <select
                name="outletSlug"
                value={form.outletSlug}
                onChange={updateField}
                disabled={noEligibleOutlet}
              >
                {eligibleOutlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.slug}>
                    {outlet.shortLabel} - {outlet.address}
                  </option>
                ))}
              </select>
              <span className={styles.fieldHelper}>
                {noEligibleOutlet ? copy.noEligibleOutlet : copy.outletHelper}
              </span>
            </label>

            <div className={styles.inlineFields}>
              <label>
                {copy.deliveryDate}
                <input
                  type="date"
                  name="deliveryDate"
                  min={minimumDeliveryDate}
                  value={form.deliveryDate}
                  onChange={updateField}
                  required
                />
              </label>

              <label>
                {copy.deliveryTime}
                <select
                  name="deliveryTime"
                  value={form.deliveryTime}
                  onChange={updateField}
                  required
                >
                  {deliveryTimes.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              {copy.promoCode}
              <input
                name="promoCode"
                value={promoCode}
                onChange={(event) => setPromoCode(event.target.value.toUpperCase())}
                placeholder={copy.promoPlaceholder}
              />
              <span className={styles.fieldHelper}>
                {promoState.loading
                  ? copy.checkingPromo
                  : promoState.error || promoState.message || ""}
              </span>
            </label>

            <label>
              {copy.cardMessage}
              <textarea
                name="cardMessage"
                rows="3"
                value={form.cardMessage}
                onChange={updateField}
              />
            </label>

            <label>
              {copy.otherNote}
              <textarea
                name="notes"
                rows="4"
                value={form.notes}
                onChange={updateField}
                placeholder={copy.notesPlaceholder}
              />
            </label>

            <button type="submit" disabled={isSubmitting || !cartProducts.length}>
              {isSubmitting ? copy.processing : copy.payWithXendit}
            </button>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className={styles.whatsappButton}
            >
              {copy.asapHelp}
            </a>
          </form>

          <aside className={styles.summaryPanel}>
            <h2>{copy.orderSummary}</h2>
            <div className={styles.summaryList}>
              {cartProducts.map((product) => (
                <div key={product.lineId} className={styles.summaryItem}>
                  <span>
                    {product.name} x {product.quantity}
                    {product.note ? ` • ${product.note}` : ""}
                  </span>
                  <strong>{formatRupiah(product.price * product.quantity)}</strong>
                </div>
              ))}
            </div>

            <div className={styles.totalRow}>
              <span>{copy.subtotal}</span>
              <strong>{formatRupiah(subtotal)}</strong>
            </div>

            {promoDiscount > 0 ? (
              <div className={styles.summaryRow}>
                <span>
                  {copy.promoDiscount}
                  {promoState.promotion?.name ? ` • ${promoState.promotion.name}` : ""}
                </span>
                <strong>-{formatRupiah(promoDiscount)}</strong>
              </div>
            ) : null}

            {form.fulfillmentType === "delivery" ? (
              <div className={styles.summaryRow}>
                <span>
                  {copy.deliveryFee}
                  {shipping.serviceType
                    ? ` • ${formatVehicleServiceType(shipping.serviceType, language)}`
                    : ""}
                </span>
                <strong>
                  {shipping.loading
                    ? copy.calculatingShipping
                    : formatRupiah(Number(shipping.fee || 0))}
                </strong>
              </div>
            ) : null}
            {form.fulfillmentType === "delivery" && shipping.error ? (
              <div className={styles.formStatus}>{shipping.error}</div>
            ) : null}

            <div className={styles.summaryRow}>
              <span>{copy.outlet}</span>
              <strong>{selectedOutlet?.shortLabel || "-"}</strong>
            </div>

            <div className={styles.totalRow}>
              <span>{copy.total}</span>
              <strong>{formatRupiah(total)}</strong>
            </div>
          </aside>
        </section>
      </main>
    </>
  );
}

export async function getServerSideProps() {
  return {
    props: {
      products: await getProducts(),
      outlets: await listOutlets()
    }
  };
}
