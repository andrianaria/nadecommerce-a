import { requireAdmin } from "@/lib/admin-auth";
import { getDeliveryVehicleRecommendation, getLalamoveSpecialRequests } from "@/lib/delivery-vehicle";
import { findOrderByReference, updateOrderByReference } from "@/lib/order-store";
import { createLalamoveOrder, createLalamoveQuote } from "@/lib/lalamove";
import { listOutlets } from "@/lib/outlet-store";
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

export default async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const reference = String(req.body?.reference || "");
  if (!reference) return res.status(400).json({ error: "Missing order reference." });

  try {
    const order = await findOrderByReference(reference);
    if (!order) return res.status(404).json({ error: "Transaction not found." });
    const products = await getProducts();
    const deliveryVehicle = getDeliveryVehicleRecommendation(products, order.items || []);

    const details = order.metadata?.checkoutDetails || {};
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
      return res.status(400).json({ error: "Data pickup/dropoff belum lengkap." });
    }

    const scheduleAt = buildJakartaScheduleAt(details.deliveryDate, details.deliveryTime);

    const serviceType = req.body.serviceType || deliveryVehicle.serviceType;
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
      return res.status(400).json({ error: "Gagal membuat quotation Lalamove." });
    }

    const senderName =
      process.env.STREET_SUSHI_SENDER_NAME || buildPickupDisplayName(outlet);
    const senderPhone = normalizePhoneE164(process.env.STREET_SUSHI_SENDER_PHONE || order.customerPhone || "");
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

    const updated = await updateOrderByReference(order.reference, {
      deliveryProvider: "lalamove",
      deliveryReference: deliveryId,
      deliveryStatus,
      deliveryQuoteId: quotationId,
      metadata: {
        ...(order.metadata || {}),
        checkoutDetails: {
          ...(details || {}),
          outletAddress: details.outletAddress || outlet?.address || null,
          outletShortLabel: details.outletShortLabel || outlet?.shortLabel || outlet?.name || null,
          deliveryServiceType: req.body.serviceType || deliveryVehicle.serviceType,
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

    return res.status(200).json({ ok: true, order: updated, quotationId, deliveryId, deliveryStatus });
  } catch (error) {
    const formatted = formatLalamoveUserError(error);
    return res.status(400).json({
      error: formatted.message,
      code: formatted.code,
      detail: formatted.parsed?.detail || null
    });
  }
}
