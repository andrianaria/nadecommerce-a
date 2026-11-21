export function isProductAvailableAtOutlet(product, outletSlug) {
  if (!product || !outletSlug) return true;

  const allowed = Array.isArray(product.availableOutletSlugs)
    ? product.availableOutletSlugs.filter(Boolean)
    : [];

  if (!allowed.length) {
    return true;
  }

  return allowed.includes(outletSlug);
}

export function filterProductsByOutlet(products, outletSlug) {
  if (!outletSlug) return products || [];
  return (products || []).filter((product) => isProductAvailableAtOutlet(product, outletSlug));
}

export function filterOutletsForProducts(outlets, products) {
  const safeOutlets = Array.isArray(outlets) ? outlets : [];
  const safeProducts = Array.isArray(products) ? products : [];
  const activeOutlets = safeOutlets.filter((outlet) => outlet?.isActive !== false);

  return activeOutlets.filter((outlet) =>
    safeProducts.every((product) => isProductAvailableAtOutlet(product, outlet.slug))
  );
}
