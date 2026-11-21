import { createOrder, createPaymentTransaction, updateOrderByReference } from "@/lib/order-store";
import { buildOrderItems, calculateSubtotal } from "@/lib/checkout-payloads";
import { getMemberSession } from "@/lib/member-auth";
import { sendCustomerOrderEmail } from "@/lib/notifications";
import { previewPromotionApplication } from "@/lib/promotion-store";
import { getProducts } from "@/lib/product-store";
import { createXenditPaymentRequest } from "@/lib/xendit";
import { listOutlets } from "@/lib/outlet-store";
import { getDeliveryVehicleRecommendation } from "@/lib/delivery-vehicle";

function normalizePaymentStatus(status) {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "PENDING") return "pending";
  if (["PAID", "SETTLED", "SUCCEEDED"].includes(normalized)) return "paid";
  if (normalized === "EXPIRED") return "expired";
  if (normalized === "FAILED") return "failed";

  return normalized.toLowerCase() || "pending";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const memberSession = await getMemberSession(req);
    const products = await getProducts();
    const outlets = await listOutlets();
    const items = buildOrderItems(products, req.body.items);
    const deliveryVehicle = getDeliveryVehicleRecommendation(products, req.body.items || []);

    if (!items.length) {
      return res.status(400).json({ error: "At least one valid cart item is required." });
    }

    const subtotal = calculateSubtotal(items);
    const promotionPreview = await previewPromotionApplication({
      cartLines: req.body.items || [],
      outletSlug: req.body.outletSlug || req.body.outletId || "",
      code: req.body.promotionCode || "",
      member: memberSession?.member || null,
      products,
      language: req.body.language || "id"
    });
    const discountAmount = Number(promotionPreview.discountAmount || 0);
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const deliveryFee = Number(req.body.deliveryFee || 0);
    const addressDetail = String(req.body.deliveryAddressDetail || "").trim();
    const rawNotes = String(req.body.notes || "").trim();
    const outletSlug = req.body.outletSlug || req.body.outletId || null;
    if (outletSlug) {
      const unavailable = items.filter((item) => {
        const product = products.find((entry) => entry.id === item.productId);
        const allowedOutlets = Array.isArray(product?.availableOutletSlugs)
          ? product.availableOutletSlugs
          : [];
        return allowedOutlets.length > 0 && !allowedOutlets.includes(outletSlug);
      });

      if (unavailable.length) {
        return res.status(400).json({
          error: `Produk berikut tidak tersedia di outlet terpilih: ${unavailable
            .map((item) => item.name)
            .join(", ")}.`
        });
      }
    }

    const outlet = outletSlug ? outlets.find((o) => o.slug === outletSlug) : null;
    const outletLat = outlet?.latitude ?? null;
    const outletLng = outlet?.longitude ?? null;
    const checkoutDetails = {
      recipientName: req.body.recipientName || req.body.customerName,
      recipientPhone: req.body.recipientPhone || req.body.customerPhone,
      deliveryAddress: req.body.deliveryAddress || "",
      deliveryLat:
        req.body.deliveryLat === null || req.body.deliveryLat === undefined || req.body.deliveryLat === ""
          ? null
          : Number(req.body.deliveryLat),
      deliveryLng:
        req.body.deliveryLng === null || req.body.deliveryLng === undefined || req.body.deliveryLng === ""
          ? null
          : Number(req.body.deliveryLng),
      deliveryPlaceId: req.body.deliveryPlaceId || null,
      deliveryAddressDetail: addressDetail || null,
      cardMessage: req.body.cardMessage || "",
      outletSlug,
      outletLat,
      outletLng,
      outletAddress: outlet?.address || null,
      outletShortLabel: outlet?.shortLabel || outlet?.name || null,
      deliveryDate: req.body.deliveryDate || null,
      deliveryTime: req.body.deliveryTime || null,
      otherNote: rawNotes,
      shippingProvider: req.body.fulfillmentType === "delivery" ? "lalamove" : null,
      deliveryServiceType:
        req.body.fulfillmentType === "delivery" ? deliveryVehicle.serviceType : null,
      deliveryWeightScore:
        req.body.fulfillmentType === "delivery" ? deliveryVehicle.totalWeight : null,
      deliverySizeCounts:
        req.body.fulfillmentType === "delivery" ? deliveryVehicle.sizeCounts : null,
      deliveryBaseFee:
        req.body.deliveryBaseFee === null || req.body.deliveryBaseFee === undefined || req.body.deliveryBaseFee === ""
          ? null
          : Number(req.body.deliveryBaseFee),
      deliveryMarkupAmount:
        req.body.deliveryMarkupAmount === null ||
        req.body.deliveryMarkupAmount === undefined ||
        req.body.deliveryMarkupAmount === ""
          ? null
          : Number(req.body.deliveryMarkupAmount),
      deliveryMarkupPercent:
        req.body.deliveryMarkupPercent === null ||
        req.body.deliveryMarkupPercent === undefined ||
        req.body.deliveryMarkupPercent === ""
          ? null
          : Number(req.body.deliveryMarkupPercent)
    };
    const order = await createOrder({
      customerName: req.body.customerName,
      customerPhone: req.body.customerPhone,
      customerEmail: req.body.customerEmail,
      fulfillmentType: req.body.fulfillmentType || "delivery",
      outletSlug,
      notes: rawNotes,
      items,
      subtotal,
      discountTotal: discountAmount,
      taxAmount: 0,
      deliveryFee,
      total: discountedSubtotal + deliveryFee,
      paymentProvider: "xendit",
      deliveryProvider: req.body.fulfillmentType === "delivery" ? "lalamove" : null,
      metadata: {
        checkoutSource: "storefront",
        customerLanguage: req.body.language || "id",
        promotion: promotionPreview.promotion
          ? {
              ...promotionPreview.promotion,
              discountAmount
            }
          : null,
        checkoutDetails
      }
    });

    const payment = await createXenditPaymentRequest(order);
    const paymentStatus = normalizePaymentStatus(payment.status);

    await createPaymentTransaction({
      orderId: order.id,
      provider: "xendit",
      providerTransactionId: payment.paymentRequestId,
      providerReference: order.reference,
      amount: order.total,
      currency: "IDR",
      status: paymentStatus,
      checkoutUrl: payment.checkoutUrl,
      rawResponse: payment,
      metadata: {
        mode: payment.mode
      }
    });

    await updateOrderByReference(order.reference, {
      paymentStatus,
      paymentProvider: "xendit",
      paymentReference: payment.paymentRequestId
    });

    let customerEmailResult = null;
    try {
      customerEmailResult = await sendCustomerOrderEmail(
        {
          ...order,
          paymentStatus,
          paymentProvider: "xendit",
          paymentReference: payment.paymentRequestId
        },
        "created"
      );
    } catch (error) {
      customerEmailResult = {
        skipped: false,
        error: error.message || "Customer email failed."
      };
    }

    return res.status(200).json({
      orderReference: order.reference,
      subtotal,
      discountAmount,
      deliveryFee,
      total: order.total,
      payment,
      customerEmailResult
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
