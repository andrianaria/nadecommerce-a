import Head from "next/head";
import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import StoreHeader from "@/components/StoreHeader";
import { formatRupiah } from "@/lib/formatters";
import { useMember } from "@/lib/member-context";
import { getOrderStatusLabel, getTrackingStage } from "@/lib/order-tracking";
import { useStoreLanguage } from "@/lib/store-language";
import styles from "@/styles/MemberArea.module.css";

function formatDateTime(value, language) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(language === "en" ? "en-US" : "id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatOutletLabel(value) {
  const text = String(value || "").trim();
  if (!text) return "-";
  return text
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function MemberOrdersPage() {
  const { member, loading } = useMember();
  const { language, copy } = useStoreLanguage();
  const [orders, setOrders] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(copy.trackingLoading);
  const [openReference, setOpenReference] = useState("");

  useEffect(() => {
    if (!loading && !member) {
      window.location.href = "/member-login";
    }
  }, [loading, member]);

  useEffect(() => {
    if (!member) return;

    async function load() {
      try {
        const response = await fetch("/api/member/orders");
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || copy.trackingLoadFailed);
        setOrders(data.orders || []);
        setStatus(copy.trackingLoaded);
      } catch (error) {
        setStatus(error.message);
      }
    }

    load();
  }, [copy.trackingLoadFailed, copy.trackingLoaded, member]);

  const filteredOrders = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return orders;
    return orders.filter((order) => String(order.reference || "").toLowerCase().includes(needle));
  }, [orders, query]);

  if (!member) {
    return null;
  }

  return (
    <>
      <Head>
        <title>{copy.trackingTitle} | Street Sushi</title>
      </Head>
      <main className={styles.pageShell}>
        <StoreHeader compact />
        <section className={styles.layout}>
          <section className={styles.heroCard}>
            <h1>{copy.trackingTitle}</h1>
            <p>{copy.trackingIntro}</p>
          </section>

          <section className={styles.searchCard}>
            <p>{copy.trackingLookup}</p>
            <div className={styles.searchRow}>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`${copy.orderReference} • SS-1779...`}
              />
            </div>
            <p className={styles.muted}>{status}</p>
          </section>

          {!filteredOrders.length ? (
            <section className={styles.emptyState}>
              <p>{copy.noRecentOrders}</p>
            </section>
          ) : (
            <section className={styles.tableCard}>
              <div className={styles.tableWrap}>
                <table className={styles.orderTable}>
                  <thead>
                    <tr>
                      <th>{copy.orderReference}</th>
                      <th>{copy.orderPlacedDate}</th>
                      <th>{copy.outlet}</th>
                      <th>{copy.orderTotal}</th>
                      <th>{copy.paymentStatus}</th>
                      <th>{copy.deliveryStatus}</th>
                      <th>{copy.details}</th>
                    </tr>
                  </thead>
                  <tbody>
              {filteredOrders.map((order) => {
                const stage = getTrackingStage(order, language);
                const details = order.metadata?.checkoutDetails || {};
                const lalamoveOrder =
                  order.metadata?.lalamove?.order?.data || order.metadata?.lalamove?.order || null;
                const driverInfo = order.metadata?.lalamove?.driver || null;
                const shareLink = lalamoveOrder?.shareLink || null;

                return (
                  <Fragment key={order.reference}>
                    <tr className={openReference === order.reference ? styles.summaryRowOpen : ""}>
                      <td className={styles.referenceCell}>
                        <strong>{order.reference}</strong>
                      </td>
                      <td>{formatDateTime(order.createdAt, language)}</td>
                      <td>{formatOutletLabel(details.outletSlug || order.outletSlug)}</td>
                      <td>{formatRupiah(order.total || 0)}</td>
                      <td>
                        <span className={styles.statusPill}>
                          {getOrderStatusLabel(order.paymentStatus, language)}
                        </span>
                      </td>
                      <td>{getOrderStatusLabel(order.deliveryStatus, language)}</td>
                      <td className={styles.detailCell}>
                        <button
                          type="button"
                          className={styles.disclosureTrigger}
                          onClick={() =>
                            setOpenReference((current) =>
                              current === order.reference ? "" : order.reference
                            )
                          }
                        >
                          {openReference === order.reference ? copy.close : copy.open}
                        </button>
                      </td>
                    </tr>
                    {openReference === order.reference ? (
                      <tr className={styles.detailRow}>
                        <td colSpan={7}>
                          <div className={styles.disclosurePanel}>
                            <div className={styles.orderTop}>
                              <div>
                                <h2>{stage.title}</h2>
                                <p className={styles.muted}>{stage.description}</p>
                              </div>
                              <span className={styles.statusPill}>
                                {getOrderStatusLabel(order.status)}
                              </span>
                            </div>

                            <div className={styles.metaGrid}>
                              <div>
                                <span>{copy.paymentStatus}</span>
                                <strong>{getOrderStatusLabel(order.paymentStatus, language)}</strong>
                              </div>
                              <div>
                                <span>{copy.deliveryStatus}</span>
                                <strong>{getOrderStatusLabel(order.deliveryStatus, language)}</strong>
                              </div>
                              <div>
                                <span>{copy.orderStatus}</span>
                                <strong>{stage.title}</strong>
                              </div>
                              <div>
                                <span>{copy.fulfillmentType}</span>
                                <strong>{String(order.fulfillmentType || "-").toUpperCase()}</strong>
                              </div>
                              <div>
                                <span>{copy.deliveryDateLabel}</span>
                                <strong>{details.deliveryDate || "-"}</strong>
                              </div>
                              <div>
                                <span>{copy.deliveryTimeLabel}</span>
                                <strong>{details.deliveryTime || "-"}</strong>
                              </div>
                            </div>

                            <div className={styles.detailBlock}>
                              <span>{copy.deliveryAddressLabel}</span>
                              <strong>{details.deliveryAddress || "-"}</strong>
                            </div>

                            <div className={styles.detailBlock}>
                              <span>{copy.itemsLabel}</span>
                              <ul className={styles.itemList}>
                                {(order.items || []).map((item, index) => (
                                  <li key={`${order.reference}-${index}`}>
                                    {item.name} x {item.quantity}
                                    {item.note ? ` • ${item.note}` : ""}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {driverInfo?.name || driverInfo?.phone || driverInfo?.plateNumber ? (
                              <div className={styles.detailBlock}>
                                <span>{copy.driverInfoLabel}</span>
                                <div className={styles.metaGrid}>
                                  {driverInfo?.name ? (
                                    <div>
                                      <span>{copy.driverNameLabel}</span>
                                      <strong>{driverInfo.name}</strong>
                                    </div>
                                  ) : null}
                                  {driverInfo?.phone ? (
                                    <div>
                                      <span>{copy.driverPhoneLabel}</span>
                                      <strong>{driverInfo.phone}</strong>
                                    </div>
                                  ) : null}
                                  {driverInfo?.plateNumber ? (
                                    <div>
                                      <span>{copy.driverPlateLabel}</span>
                                      <strong>{driverInfo.plateNumber}</strong>
                                    </div>
                                  ) : null}
                                </div>
                                {driverInfo?.phone ? (
                                  <div className={styles.orderActions}>
                                    <a
                                      href={`https://example.com/contact/${String(driverInfo.phone).replace(/\D+/g, "")}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={styles.secondaryAction}
                                    >
                                      {copy.callDriver}
                                    </a>
                                  </div>
                                ) : null}
                              </div>
                            ) : null}

                            {shareLink ? (
                              <div className={styles.orderActions}>
                                <a
                                  href={shareLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={styles.primaryAction}
                                >
                                  {copy.trackingLink}
                                </a>
                              </div>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <section className={styles.emptyState}>
            <p>{copy.trackingHelp}</p>
            <div className={styles.orderActions}>
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
