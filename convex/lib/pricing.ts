// Optimal-bundle pricing. Used by both backend and frontend (via src/lib/pricing).
//
// Rule: extra days BEYOND a full week/month are billed at the prorated
// weekly/monthly day-rate, not the full daily rate. We try every combination of
// months + weeks + (leftover days at weekly per-diem), AND at every months
// count we also try "monthly + remainder × monthly/30", and return the cheapest.

export interface PricingRates {
  daily: number;
  weekly: number;
  monthly: number;
}

export function computeTotal(n: number, rates: PricingRates): number {
  if (!n || n < 1) return 0;
  if (n < 7) return n * rates.daily;
  let best = Infinity;
  for (let m = 0; m <= Math.floor(n / 30) + 1; m++) {
    const afterMonths = n - m * 30;
    if (afterMonths < 0) continue;
    const directDaily = m * rates.monthly + afterMonths * rates.daily;
    if (directDaily < best) best = directDaily;
    for (let w = 1; w <= Math.floor(afterMonths / 7) + 1; w++) {
      const leftover = afterMonths - w * 7;
      if (leftover < 0) continue;
      const cost =
        m * rates.monthly + w * rates.weekly + leftover * (rates.weekly / 7);
      if (cost < best) best = cost;
    }
    if (m > 0) {
      const monthlyProrated =
        m * rates.monthly + afterMonths * (rates.monthly / 30);
      if (monthlyProrated < best) best = monthlyProrated;
    }
  }
  return Math.round(best);
}

export function perDay(n: number, rates: PricingRates): number {
  return n > 0 ? computeTotal(n, rates) / n : rates.daily;
}

export function daysBetweenISO(startISO: string, endISO: string): number {
  const a = new Date(startISO).getTime();
  const b = new Date(endISO).getTime();
  return Math.round((b - a) / 86400000);
}
