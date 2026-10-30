export function normalizePurchasableMaximum(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(0, Math.floor(value));
}

export function getRemainingPurchasableQuantity(
  maxPurchasableQuantity: number | null | undefined,
  quantityAlreadyInCart: number,
) {
  const maximum = normalizePurchasableMaximum(maxPurchasableQuantity);
  if (maximum === null) return null;

  return Math.max(0, maximum - normalizeCartQuantity(quantityAlreadyInCart));
}

export function exceedsPurchasableMaximum(
  quantity: number,
  maxPurchasableQuantity: number | null | undefined,
) {
  const maximum = normalizePurchasableMaximum(maxPurchasableQuantity);
  return maximum !== null && normalizeCartQuantity(quantity) > maximum;
}

function normalizeCartQuantity(quantity: number) {
  if (!Number.isFinite(quantity)) return 0;
  return Math.max(0, Math.floor(quantity));
}
