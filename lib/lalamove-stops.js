function compactParts(parts) {
  return parts
    .map((part) => String(part || "").trim())
    .filter(Boolean);
}

export function buildPickupDisplayName(outlet) {
  const shortLabel = String(outlet?.shortLabel || "").trim();
  const name = String(outlet?.name || "").trim();

  if (name && /^street sushi/i.test(name)) {
    return name;
  }

  if (shortLabel) {
    if (/^street sushi/i.test(shortLabel)) {
      return shortLabel;
    }
    return `Street Sushi ${shortLabel}`;
  }

  if (name) {
    return `Street Sushi ${name}`;
  }

  return "Street Sushi";
}

export function buildPickupAddress(outlet, fallbackAddress) {
  const displayName = buildPickupDisplayName(outlet);
  const baseAddress = String(fallbackAddress || outlet?.address || "").trim();
  return compactParts([displayName, baseAddress]).join(" - ");
}

export function buildDropoffAddress(baseAddress, detailAddress) {
  const normalizedBase = String(baseAddress || "").trim();
  const normalizedDetail = String(detailAddress || "").trim();

  if (!normalizedDetail) {
    return normalizedBase;
  }

  if (!normalizedBase) {
    return normalizedDetail;
  }

  if (normalizedBase.toLowerCase().includes(normalizedDetail.toLowerCase())) {
    return normalizedBase;
  }

  return `${normalizedBase} - ${normalizedDetail}`;
}

export function buildDriverRemarks({ reference, totalLabel, outlet, detailAddress }) {
  return compactParts([
    reference ? `Street Sushi order ${reference}` : "",
    outlet ? `Pickup: ${buildPickupDisplayName(outlet)}` : "",
    detailAddress ? `Detail alamat: ${detailAddress}` : "",
    totalLabel ? `Total: ${totalLabel}` : ""
  ]).join(" | ");
}
