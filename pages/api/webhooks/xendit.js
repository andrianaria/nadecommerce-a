import {
  createPaymentLog,
  findOrderByReference,
  updateOrderByReference
} from "@/lib/order-store";
import { getDeliveryVehicleRecommendation, getLalamoveSpecialRequests } from "@/lib/delivery-vehicle";
import { createLalamoveOrder, createLalamoveQuote } from "@/lib/lalamove";
import { listOutlets } from "@/lib/outlet-store";
import { sendCustomerOrderEmail, sendPaidOrderNotifications } from "@/lib/notifications";
import { formatRupiah } from "@/lib/formatters";
import { formatLalamoveUserError } from "@/lib/lalamove-errors";
import {
  buildDriverRemarks,
  buildDropoffAddress,
  buildPickupAddress,
  buildPickupDisplayName
} from "@/lib/lalamove-stops";
import { getProducts } from "@/lib/product-store";
import { buildJakartaScheduleAt } from "@/lib/jakarta-time";

function normalizePhoneE164(input, defaultCountry = "62") {
  const raw = String(input || "").trim();
  if (!raw) return "";
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith(defaultCountry)) return `+${cleaned}`;
  if (cleaned.startsWith("0")) return `+${defaultCountry}${cleaned.slice(1)}`;
  return `+${defaultCountry}${cleaned}`;
}

function normalizeXenditStatus(status) {
  const normalized = String(status || "").toUpperCase();

  if (["PAID", "SETTLED", "SUCCEEDED"].includes(normalized)) {
    return "paid";
  }

  if (["PENDING"].includes(normalized)) {
    return "pending";
  }

  if (["EXPIRED"].includes(normalized)) {
    return "expired";
  }

  if (["FAILED"].includes(normalized)) {
    return "failed";
  }

  return normalized.toLowerCase() || "paid";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  if (
    process.env.XENDIT_WEBHOOK_TOKEN &&
    req.headers["x-callback-token"] !== process.env.XENDIT_WEBHOOK_TOKEN
  ) {
    return res.status(401).json({ error: "Invalid callback token." });
  }

  const reference =
    req.body.external_id ||
    req.body.reference_id ||
    req.body.data?.external_id ||
    req.body.data?.reference_id;
  const rawStatus = req.body.status || req.body.data?.status || "PAID";
  const paymentStatus = normalizeXenditStatus(rawStatus);

  if (!reference) {
    return res.status(400).json({ error: "Missing order reference." });
  }

  const existingOrder = await findOrderByReference(reference);

  const updatedOrder = await updateOrderByReference(reference, {
    status: paymentStatus === "paid" ? "paid" : existingOrder?.status || "pending",
    paymentStatus,
    paymentProvider: "xendit",
    paymentReference: req.body.id || req.body.data?.id || null,
    metadata: {
      ...(existingOrder?.metadata || {}),
      xenditWebhook: req.body
    }
  });

  if (updatedOrder?.id) {
    await createPaymentLog({
      orderId: updatedOrder.id,
      eventType: "xendit.webhook",
      provider: "xendit",
      providerEventId: req.body.id || req.body.data?.id || null,
      status: paymentStatus,
      payload: req.body
    });
  }

  let notificationResult = null;
  let deliveryResult = null;

  if (paymentStatus === "paid" && updatedOrder) {
    notificationResult = await sendPaidOrderNotifications(updatedOrder);
    try {
      await sendCustomerOrderEmail(updatedOrder, "paid");
    } catch (error) {
      notificationResult = {
        ...(notificationResult || {}),
        customerEmailError: error.message || "Customer paid email failed."
      };
    }

    const details = updatedOrder.metadata?.checkoutDetails || {};
    const shouldCreateDelivery =
      updatedOrder.fulfillmentType === "delivery" &&
      String(updatedOrder.deliveryProvider || details.shippingProvider || "") !== "" &&
      !updatedOrder.deliveryReference;

    if (shouldCreateDelivery) {
      try {
        const products = await getProducts();
        const deliveryVehicle = getDeliveryVehicleRecommendation(products, updatedOrder.items || []);
        const outlets = await listOutlets();
        const outlet =
          outlets.find((o) => o.slug === updatedOrder.outletSlug) ||
          outlets.find((o) => o.slug === details.outletSlug) ||
          null;

        const pickupLat = outlet?.latitude ?? details.outletLat ?? null;
        const pickupLng = outlet?.longitude ?? details.outletLng ?? null;
        const pickupAddress = buildPickupAddress(outlet, details.outletAddress || null);

        const dropLat = details.deliveryLat ?? null;
        const dropLng = details.deliveryLng ?? null;
        const dropAddress = buildDropoffAddress(
          details.deliveryAddress || null,
          details.deliveryAddressDetail || null
        );

        if (
          pickupLat != null &&
          pickupLng != null &&
          pickupAddress &&
          dropLat != null &&
          dropLng != null &&
          dropAddress
        ) {
          const scheduleAt = buildJakartaScheduleAt(details.deliveryDate, details.deliveryTime);

          const serviceType = deliveryVehicle.serviceType;
          const specialRequests = getLalamoveSpecialRequests(serviceType);

          const quote = await createLalamoveQuote({
            data: {
              serviceType,
              language: "id_ID",
              scheduleAt,
              stops: [
                {
                  coordinates: { lat: Number(pickupLat), lng: Number(pickupLng) },
                  address: pickupAddress
                },
                {
                  coordinates: { lat: Number(dropLat), lng: Number(dropLng) },
                  address: dropAddress
                }
              ],
              specialRequests
            }
          });

          const quotationId = quote?.data?.quotationId || quote?.quotationId || null;
          const stopIds = (quote?.data?.stops || quote?.stops || []).map((s) => s.stopId).filter(Boolean);

          if (quotationId && stopIds.length >= 2) {
            const senderName =
              process.env.STREET_SUSHI_SENDER_NAME || buildPickupDisplayName(outlet);
            const senderPhone = normalizePhoneE164(process.env.STREET_SUSHI_SENDER_PHONE || "");

            const recipientName = details.recipientName || updatedOrder.customerName || "Penerima";
            const recipientPhone = normalizePhoneE164(details.recipientPhone || updatedOrder.customerPhone || "");

            const remarks = buildDriverRemarks({
              reference: updatedOrder.reference,
              totalLabel: formatRupiah(updatedOrder.total || 0),
              outlet,
              detailAddress: details.deliveryAddressDetail || null
            });

            const deliveryOrder = await createLalamoveOrder({
              data: {
                quotationId,
                sender: {
                  stopId: stopIds[0],
                  name: senderName,
                  phone: senderPhone
                },
                recipients: [
                  {
                    stopId: stopIds[1],
                    name: recipientName,
                    phone: recipientPhone,
                    remarks
                  }
                ],
                isPODEnabled: false,
                metadata: {
                  orderReference: updatedOrder.reference
                }
              }
            });

            const deliveryId =
              deliveryOrder?.data?.orderId || deliveryOrder?.orderId || null;
            const deliveryStatus =
              deliveryOrder?.data?.status || deliveryOrder?.status || "pending";

            await updateOrderByReference(updatedOrder.reference, {
              deliveryProvider: "lalamove",
              deliveryReference: deliveryId,
              deliveryStatus,
              deliveryQuoteId: quotationId,
              metadata: {
                ...(updatedOrder.metadata || {}),
                checkoutDetails: {
                  ...(details || {}),
                  outletAddress: details.outletAddress || outlet?.address || null,
                  outletShortLabel: details.outletShortLabel || outlet?.shortLabel || outlet?.name || null,
                  deliveryServiceType: deliveryVehicle.serviceType,
                  deliveryWeightScore: details.deliveryWeightScore ?? deliveryVehicle.totalWeight,
                  deliverySizeCounts: details.deliverySizeCounts || deliveryVehicle.sizeCounts,
                  lalamoveSpecialRequests: specialRequests
                },
                lalamove: {
                  quotation: quote,
                  order: deliveryOrder
                }
              }
            });

            deliveryResult = { ok: true, deliveryId, deliveryStatus };
          } else {
            deliveryResult = { ok: false, error: "Gagal membuat quotation Lalamove (quotationId/stopId kosong)." };
          }
        } else {
          deliveryResult = { ok: false, error: "Data pickup/dropoff belum lengkap untuk Lalamove." };
        }
      } catch (error) {
        const formatted = formatLalamoveUserError(error);
        deliveryResult = { ok: false, code: formatted.code, error: formatted.message, detail: formatted.parsed?.detail || null };
      }
    }
  }

  return res.status(200).json({ ok: true, paymentStatus, notificationResult, deliveryResult });
}
