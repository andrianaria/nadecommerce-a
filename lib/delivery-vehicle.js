const DELIVERY_SIZE_WEIGHTS = {
  small: 0.1,
  medium: 1,
  large: 2
};

export const LALAMOVE_SERVICE_TYPES = {
  motorcycle: "MOTORCYCLE",
  mpv: "MPV",
  van: "VAN"
};

export function getLalamoveSpecialRequests(serviceType) {
  const normalized = String(serviceType || "").trim().toUpperCase();
  if (normalized === LALAMOVE_SERVICE_TYPES.motorcycle) {
    return ["THERMAL_BAG_1"];
  }
  return [];
}

export function normalizeDeliverySize(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "small" || normalized === "medium" || normalized === "large") {
    return normalized;
  }
  return "small";
}

export function inferProductDeliverySize(product = {}) {
  const explicit = product.deliverySize || product.metadata?.deliverySize;
  if (explicit) {
    return normalizeDeliverySize(explicit);
  }

  const category = String(product.category || "").toLowerCase();
  const serves = String(product.serves || "").toLowerCase();
  const pieces = Number(product.pieces || 0);

  if (category.includes("hamper") || category.includes("platter") || category.includes("paket")) {
    return "medium";
  }

  if (pieces > 60 || /5\s*-\s*6|6\s*-\s*8|8\s*-\s*10|10\s*-\s*12/.test(serves)) {
    return "medium";
  }

  return "small";
}

export function getDeliveryWeight(size) {
  return DELIVERY_SIZE_WEIGHTS[normalizeDeliverySize(size)] || DELIVERY_SIZE_WEIGHTS.small;
}

function findProductForLine(products, line) {
  const lineProductId = line.productId ?? line.productSlug ?? line.id ?? null;
  return (
    products.find(
      (product) =>
        product.id === lineProductId ||
        product.dbId === lineProductId ||
        product.id === line.productSlug
    ) || null
  );
}

export function getDeliveryVehicleRecommendation(products = [], cartLines = []) {
  const normalizedLines = (cartLines || [])
    .map((line) => {
      const product = findProductForLine(products, line);
      if (!product) return null;

      const quantity = Math.max(1, Number(line.quantity || 1));
      const deliverySize = inferProductDeliverySize(product);

      return {
        productId: product.id,
        quantity,
        deliverySize,
        weight: getDeliveryWeight(deliverySize) * quantity
      };
    })
    .filter(Boolean);

  const totals = normalizedLines.reduce(
    (summary, line) => {
      summary.totalWeight += line.weight;
      summary.totalQuantity += line.quantity;
      summary.sizeCounts[line.deliverySize] += line.quantity;
      return summary;
    },
    {
      totalWeight: 0,
      totalQuantity: 0,
      sizeCounts: { small: 0, medium: 0, large: 0 }
    }
  );

  let serviceType = LALAMOVE_SERVICE_TYPES.motorcycle;
  let vehicleType = "motor";

  if (totals.totalWeight > 8 || totals.sizeCounts.large >= 4) {
    serviceType = LALAMOVE_SERVICE_TYPES.van;
    vehicleType = "van";
  } else if (totals.totalWeight > 1.5) {
    serviceType = LALAMOVE_SERVICE_TYPES.mpv;
    vehicleType = "mpv";
  }

  return {
    vehicleType,
    serviceType,
    totalWeight: Number(totals.totalWeight.toFixed(2)),
    totalQuantity: totals.totalQuantity,
    sizeCounts: totals.sizeCounts,
    lines: normalizedLines
  };
}
