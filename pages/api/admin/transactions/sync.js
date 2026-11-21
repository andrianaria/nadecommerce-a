import { requireAdmin } from "@/lib/admin-auth";
import { findOrderByReference, listOrders, updateOrderByReference } from "@/lib/order-store";
import { getDeliveryVehicleRecommendation, getLalamoveSpecialRequests } from "@/lib/delivery-vehicle";
import { fetchXenditInvoice } from "@/lib/xendit";
import { createLalamoveOrder, createLalamoveQuote } from "@/lib/lalamove";
import { listOutlets } from "@/lib/outlet-store";
import {
  buildDriverRemarks,
  buildDropoffAddress,
  buildPickupAddress,
  buildPickupDisplayName
} from "@/lib/lalamove-stops";
import { getProducts } from "@/lib/product-store";
import { buildJakartaScheduleAt } from "@/lib/jakarta-time";

const syncableStatuses = new Set(["unpaid", "pending"]);

function normalizePhoneE164(input, defaultCountry = "62") {
  const raw = String(input || "").trim();
  if (!raw) return "";
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith(defaultCountry)) return `+${cleaned}`;
  if (cleaned.startsWith("0")) return `+${defaultCountry}${cleaned.slice(1)}`;
  return `+${defaultCountry}${cleaned}`;
}

async function maybeCreateLalamoveDelivery(order) {
  const details = order.metadata?.checkoutDetails || {};
  if (order.fulfillmentType !== "delivery") return { skipped: true, reason: "not_delivery" };
  if (order.deliveryReference) return { skipped: true, reason: "already_has_delivery" };
  const products = await getProducts();
  const deliveryVehicle = getDeliveryVehicleRecommendation(products, order.items || []);

  const outlets = await listOutlets();
  const outlet =
    outlets.find((o) => o.slug === order.outletSlug) ||
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
    pickupLat == null ||
    pickupLng == null ||
    !pickupAddress ||
    dropLat == null ||
    dropLng == null ||
    !dropAddress
  ) {
    return { skipped: true, reason: "missing_coords" };
  }

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
          coordinates: { lat: String(pickupLat), lng: String(pickupLng) },
          address: pickupAddress
        },
        {
          coordinates: { lat: String(dropLat), lng: String(dropLng) },
          address: dropAddress
        }
      ],
      specialRequests
    }
  });

  const quotationId = quote?.data?.quotationId || quote?.quotationId || null;
  const stopIds = (quote?.data?.stops || quote?.stops || []).map((s) => s.stopId).filter(Boolean);
  if (!quotationId || stopIds.length < 2) {
    return { skipped: true, reason: "quotation_failed" };
  }

  const senderName =
    process.env.STREET_SUSHI_SENDER_NAME || buildPickupDisplayName(outlet);
  const senderPhone = normalizePhoneE164(process.env.STREET_SUSHI_SENDER_PHONE || "");
  const recipientName = details.recipientName || order.customerName || "Penerima";
  const recipientPhone = normalizePhoneE164(details.recipientPhone || order.customerPhone || "");

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
          remarks: buildDriverRemarks({
            reference: order.reference,
            outlet,
            detailAddress: details.deliveryAddressDetail || null
          })
        }
      ],
      isPODEnabled: false,
      metadata: { orderReference: order.reference }
    }
  });

  const deliveryId = deliveryOrder?.data?.orderId || deliveryOrder?.orderId || null;
  const deliveryStatus = deliveryOrder?.data?.status || deliveryOrder?.status || "pending";

  await updateOrderByReference(order.reference, {
    deliveryProvider: "lalamove",
    deliveryReference: deliveryId,
    deliveryStatus,
    deliveryQuoteId: quotationId,
      metadata: {
        ...(order.metadata || {}),
        lalamove: {
          quotation: quote,
          order: deliveryOrder
        },
        checkoutDetails: {
          ...(details || {}),
          outletAddress: details.outletAddress || outlet?.address || null,
          outletShortLabel: details.outletShortLabel || outlet?.shortLabel || outlet?.name || null,
          deliveryServiceType: deliveryVehicle.serviceType,
          deliveryWeightScore: details.deliveryWeightScore ?? deliveryVehicle.totalWeight,
          deliverySizeCounts: details.deliverySizeCounts || deliveryVehicle.sizeCounts,
          lalamoveSpecialRequests: specialRequests
        }
      }
  });

  return { ok: true, deliveryId, deliveryStatus };
}

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const reference = req.body?.reference ? String(req.body.reference) : null;

  try {
    const orders = await listOrders();
    const candidates = reference
      ? orders.filter((o) => o.reference === reference)
      : orders.filter(
          (o) =>
            o.paymentProvider === "xendit" &&
            syncableStatuses.has(String(o.paymentStatus || "unpaid")) &&
            o.paymentReference
        );

    const results = [];

    for (const order of candidates.slice(0, reference ? 1 : 25)) {
      try {
        const invoice = await fetchXenditInvoice(order.paymentReference);
        const nextPaymentStatus = invoice.status;
        const shouldEnsureDelivery =
          nextPaymentStatus === "paid" &&
          order.fulfillmentType === "delivery" &&
          !order.deliveryReference;

        if (nextPaymentStatus !== order.paymentStatus) {
          const updated = await updateOrderByReference(order.reference, {
            status: nextPaymentStatus === "paid" ? "paid" : order.status,
            paymentStatus: nextPaymentStatus,
            paidAt: nextPaymentStatus === "paid" ? invoice.paidAt || new Date().toISOString() : order.paidAt
          });
          let delivery = null;
          if (shouldEnsureDelivery) {
            const reloaded = updated?.reference ? await findOrderByReference(updated.reference) : null;
            if (reloaded) {
              delivery = await maybeCreateLalamoveDelivery(reloaded);
            }
          }
          results.push({
            reference: order.reference,
            ok: true,
            updated: true,
            paymentStatus: updated?.paymentStatus,
            delivery
          });
        } else {
          let delivery = null;
          if (shouldEnsureDelivery) {
            const reloaded = await findOrderByReference(order.reference);
            if (reloaded) {
              delivery = await maybeCreateLalamoveDelivery(reloaded);
            }
          }

          results.push({
            reference: order.reference,
            ok: true,
            updated: false,
            paymentStatus: order.paymentStatus,
            delivery
          });
        }
      } catch (error) {
        results.push({ reference: order.reference, ok: false, error: error.message });
      }
    }

    return res.status(200).json({ ok: true, results });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
