export function parsePrice(prijs: string): number {
  const n = parseFloat(prijs.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function applyDiscount(price: number, percent: number): number {
  if (percent <= 0) return price;
  return Math.round(price * (1 - percent / 100) * 100) / 100;
}

export function formatEuro(amount: number): string {
  return amount.toFixed(2).replace(".", ",");
}

export const DISCOUNT_PRESETS = [10, 15, 20, 25] as const;
