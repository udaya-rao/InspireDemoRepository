
// Pre-initialized formatters for standard stock display (cached in memory for high performance)
const integerFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const defaultDecimalFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
});


export function formatStockQuantity(val, unit, options = {}) {
  const { maxDecimals, minDecimals, emptyValue = "" } = options;

  if (val == null || val === "") return emptyValue;
  const num = Number(val);
  if (Number.isNaN(num)) return emptyValue;

  const isNos = String(unit || "").trim().toUpperCase() === "NOS";

  // Use fast cached formatters when standard default options are used
  if (maxDecimals === undefined && minDecimals === undefined) {
    return (isNos ? integerFormatter : defaultDecimalFormatter).format(num);
  }

  // Dynamic custom options if explicitly specified
  const resolvedMax = isNos ? 0 : (maxDecimals !== undefined ? maxDecimals : 4);
  const resolvedMin = minDecimals !== undefined ? minDecimals : 0;

  return num.toLocaleString(undefined, {
    minimumFractionDigits: resolvedMin,
    maximumFractionDigits: resolvedMax,
  });
}

