import { createLalamoveOrder } from "@/lib/lalamove";
import { updateOrderByReference } from "@/lib/order-store";
import { formatLalamoveUserError } from "@/lib/lalamove-errors";

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
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const sender = req.body.sender || {};
    const recipients = Array.isArray(req.body.recipients) ? req.body.recipients : [];

    const deliveryOrder = await createLalamoveOrder({
      data: {
        quotationId: req.body.quotationId,
        sender: {
          ...sender,
          phone: normalizePhoneE164(sender.phone)
        },
        recipients: recipients.map((r) => ({
          ...r,
          phone: normalizePhoneE164(r.phone)
        })),
        isPODEnabled: false,
        metadata: {
          orderReference: req.body.orderReference
        }
      }
    });

    if (req.body.orderReference) {
      await updateOrderByReference(req.body.orderReference, {
        deliveryStatus: deliveryOrder.status || "pending",
        deliveryProvider: "lalamove",
        deliveryReference: deliveryOrder.orderId || null,
        deliveryQuoteId: req.body.quotationId || null
      });
    }

    return res.status(200).json({ deliveryOrder });
  } catch (error) {
    const formatted = formatLalamoveUserError(error);
    return res.status(400).json({
      error: formatted.message,
      code: formatted.code,
      detail: formatted.parsed?.detail || null,
      debug: process.env.NODE_ENV === "production" ? undefined : { raw: formatted.parsed?.raw || null }
    });
  }
}
