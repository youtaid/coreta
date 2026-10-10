const integerFormat = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });
const percentFormat = new Intl.NumberFormat("id-ID", {
  style: "percent",
  maximumFractionDigits: 0,
});

/** 29900 → "Rp29.900" (house style: no space after "Rp"). */
export function formatRupiah(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  return `${sign}Rp${integerFormat.format(Math.abs(Math.round(amount)))}`;
}

/** 0.875 → "88%" (score/ratio in 0-1). */
export function formatPercent(ratio: number): string {
  return percentFormat.format(ratio).replace(/\s/g, "");
}

const decimalFormat = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });

/** 0.5 → "0,5" (Indonesian decimal comma). */
export function formatNumber(value: number): string {
  return decimalFormat.format(value);
}
