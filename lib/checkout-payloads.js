export function buildOrderItems(products, cartLines = []) {
  return cartLines
    .map((line) => {
      const product = products.find((entry) => entry.id === line.productId);

      if (!product) {
        return null;
      }

      return {
        productId: product.dbId || product.id,
        productSlug: product.id,
        name: product.name,
        quantity: Number(line.quantity || 1),
        price: Number(product.price),
        note: String(line.note || "").trim()
      };
    })
    .filter(Boolean);
}

export function calculateSubtotal(items) {
  return items.reduce(
    (total, item) => total + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );
}

export function calculatePb1(subtotal) {
  return Math.round(Number(subtotal || 0) * 0.1);
}
