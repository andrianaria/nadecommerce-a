import { createHmac } from "crypto";

const baseUrls = {
  sandbox: "https://rest.sandbox.lalamove.com",
  production: "https://rest.lalamove.com"
};

function getLalamoveBaseUrl() {
  const environment = process.env.LALAMOVE_ENVIRONMENT || "sandbox";
  return baseUrls[environment] || baseUrls.sandbox;
}

function buildAuthHeader(method, path, bodyString = "") {
  const timestamp = Date.now().toString();
  const rawSignature = `${timestamp}\r\n${method.toUpperCase()}\r\n${path}\r\n\r\n${bodyString}`;
  const signature = createHmac("sha256", process.env.LALAMOVE_API_SECRET || "")
    .update(rawSignature)
    .digest("hex");

  return {
    authorization: `hmac ${process.env.LALAMOVE_API_KEY}:${timestamp}:${signature}`,
    market: process.env.LALAMOVE_MARKET || "ID"
  };
}

async function lalamoveRequest(method, path, body) {
  if (!process.env.LALAMOVE_API_KEY || !process.env.LALAMOVE_API_SECRET) {
    const stops = body?.data?.stops || [];
    return {
      mode: "demo",
      data: {
        quotationId: "demo-quotation",
        orderId: "demo-order",
        status: "ASSIGNING_DRIVER",
        priceBreakdown: {
          total: "42000",
          currency: "IDR"
        },
        stops: stops.map((stop, idx) => ({
          ...stop,
          stopId: `demo-stop-${idx + 1}`
        }))
      }
    };
  }

  const bodyString = body ? JSON.stringify(body) : "";
  const auth = buildAuthHeader(method, path, bodyString);
  const response = await fetch(`${getLalamoveBaseUrl()}${path}`, {
    method,
    headers: {
      Authorization: auth.authorization,
      Market: auth.market,
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    ...(body ? { body: bodyString } : {})
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Lalamove request failed: ${errorText}`);
  }

  return response.json();
}

export async function createLalamoveQuote(payload) {
  return lalamoveRequest("POST", "/v3/quotations", payload);
}

export async function createLalamoveOrder(payload) {
  return lalamoveRequest("POST", "/v3/orders", payload);
}

export async function getLalamoveOrder(orderId) {
  if (!orderId) {
    throw new Error("Order ID Lalamove tidak tersedia.");
  }

  return lalamoveRequest("GET", `/v3/orders/${orderId}`);
}
