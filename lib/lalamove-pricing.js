function getMarkupPercent() {
  const raw = Number(process.env.LALAMOVE_CUSTOMER_MARKUP_PERCENT || 15);
  return Number.isFinite(raw) ? raw : 15;
}

function getRoundingUnit() {
  const raw = Number(process.env.LALAMOVE_CUSTOMER_ROUNDING || 1000);
  return Number.isFinite(raw) && raw > 0 ? raw : 1000;
}

export function calculateCustomerDeliveryFee(baseFee) {
  const normalizedBaseFee = Number(baseFee || 0);
  const markupPercent = getMarkupPercent();
  const roundingUnit = getRoundingUnit();
  const markedUpValue = normalizedBaseFee * (1 + markupPercent / 100);
  const customerFee = Math.ceil(markedUpValue / roundingUnit) * roundingUnit;
  const markupAmount = Math.max(0, customerFee - normalizedBaseFee);

  return {
    baseFee: normalizedBaseFee,
    markupPercent,
    markupAmount,
    roundingUnit,
    customerFee
  };
}

