export function formatAssetPrice(val) {
  if (val === undefined || val === null) return 0;
  if (val > 0 && val < 10) {
    return Number(val.toFixed(2));
  }
  return Math.round(val);
}

export function money(value) {
  if (value === null || value === undefined) return "0 ₺"
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0
  }).format(value)
}
