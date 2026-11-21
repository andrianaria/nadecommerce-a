import { getPublicAppUrl } from "@/lib/store-config";

const xenditBaseUrl = "https://api.xendit.co";

function getBasicAuthHeader() {
  return `Basic ${Buffer.from(`${process.env.XENDIT_SECRET_KEY}:`).toString("base64")}`;
}

export async function createXenditPaymentRequest(order) {
  if (!process.env.XENDIT_SECRET_KEY) {
    return {
      mode: "demo",
      checkoutUrl: `${getPublicAppUrl()}/?demo-payment=${order.reference}`,
      paymentRequestId: `demo-${order.reference}`,
      status: "awaiting_payment"
    };
  }

  const response = await fetch(`${xenditBaseUrl}/v2/invoices`, {
    method: "POST",
    headers: {
      Authorization: getBasicAuthHeader(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      external_id: order.reference,
      amount: order.total,
      payer_email: order.customerEmail || undefined,
      description: `Street Sushi order ${order.reference}`,
      currency: "IDR",
      should_send_email: Boolean(order.customerEmail),
      // Make sure payment status updates reach our backend.
      callback_url: `${getPublicAppUrl()}/api/webhooks/xendit`,
      success_return_url: `${getPublicAppUrl()}/checkout/success?order=${order.reference}`,
      failure_return_url: `${getPublicAppUrl()}/checkout/failed?order=${order.reference}`,
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        category: "food"
      })),
      metadata: {
        source: "street-sushi-shop",
        orderReference: order.reference,
        customerName: order.customerName,
        customerPhone: order.customerPhone
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Xendit payment request failed: ${errorText}`);
  }

  const payload = await response.json();

  return {
    mode: "live",
    checkoutUrl: payload.invoice_url || null,
    paymentRequestId: payload.id,
    status: payload.status
  };
}

function normalizeInvoiceStatus(status) {
  const normalized = String(status || "").toUpperCase();
  if (["PAID", "SETTLED", "SUCCEEDED"].includes(normalized)) return "paid";
  if (["PENDING"].includes(normalized)) return "pending";
  if (["EXPIRED"].includes(normalized)) return "expired";
  if (["FAILED"].includes(normalized)) return "failed";
  return normalized.toLowerCase() || "pending";
}

export async function fetchXenditInvoice(invoiceId) {
  if (!process.env.XENDIT_SECRET_KEY) {
    throw new Error("Xendit secret key is missing.");
  }
  if (!invoiceId) {
    throw new Error("Missing Xendit invoice id.");
  }

  const response = await fetch(`${xenditBaseUrl}/v2/invoices/${encodeURIComponent(invoiceId)}`, {
    headers: {
      Authorization: getBasicAuthHeader()
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Xendit invoice fetch failed: ${errorText}`);
  }

  const payload = await response.json();
  return {
    raw: payload,
    status: normalizeInvoiceStatus(payload.status),
    paidAt: payload.paid_at || payload.paidAt || null
  };
}
