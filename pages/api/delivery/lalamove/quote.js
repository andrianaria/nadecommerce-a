import { createLalamoveQuote } from "@/lib/lalamove";
import { formatLalamoveUserError } from "@/lib/lalamove-errors";
import { calculateCustomerDeliveryFee } from "@/lib/lalamove-pricing";
import { getDeliveryVehicleRecommendation, getLalamoveSpecialRequests } from "@/lib/delivery-vehicle";
import { getProducts } from "@/lib/product-store";

function normalizeStop(stop) {
  const lat = stop?.coordinates?.lat ?? stop?.coordinates?.latitude ?? null;
  const lng = stop?.coordinates?.lng ?? stop?.coordinates?.longitude ?? null;
  return {
    coordinates: {
      lat: lat == null ? undefined : String(lat),
      lng: lng == null ? undefined : String(lng)
    },
    address: String(stop?.address || "").trim()
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const products = await getProducts();
    const vehicle = getDeliveryVehicleRecommendation(products, req.body.items || []);
    const serviceType = req.body.serviceType || vehicle.serviceType;
    const stops = Array.isArray(req.body.stops) ? req.body.stops.map(normalizeStop) : [];
    const quote = await createLalamoveQuote({
      data: {
        serviceType,
        language: "id_ID",
        scheduleAt: req.body.scheduleAt || undefined,
        stops,
        specialRequests: req.body.specialRequests || getLalamoveSpecialRequests(serviceType)
      }
    });

    const breakdown = quote?.data?.priceBreakdown || quote?.priceBreakdown || {};
    const baseFee = Number(breakdown.total || 0);
    const pricing = calculateCustomerDeliveryFee(baseFee);

    return res.status(200).json({
      quote,
      baseFee: pricing.baseFee,
      markupPercent: pricing.markupPercent,
      markupAmount: pricing.markupAmount,
      customerFee: pricing.customerFee,
      currency: breakdown.currency || "IDR",
      serviceType,
      vehicleRecommendation: vehicle
    });
  } catch (error) {
    const formatted = formatLalamoveUserError(error);
    return res.status(400).json({
      error: formatted.message,
      code: formatted.code,
      detail: formatted.parsed?.detail || null,
      debug: process.env.NODE_ENV === "production" ? undefined : { request: req.body, raw: formatted.parsed?.raw || null }
    });
  }
}
