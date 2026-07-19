export function formatAssetPrice(val) {
  if (val === undefined || val === null) return 0;
  if (val > 0 && val < 1) {
    return Math.max(0.1, Number(val.toFixed(1)));
  }
  return Math.round(val);
}
