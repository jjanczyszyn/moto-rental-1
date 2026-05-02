// Optimal-bundle pricing. Used by both backend and frontend (via src/lib/pricing).
//
// Rule: extra days BEYOND a full week/month are billed at the prorated
// weekly/monthly day-rate, not the full daily rate. We try every combination of
// months + weeks + (leftover days at weekly per-diem), AND at every months
// count we also try "monthly + remainder × monthly/30", and return the cheapest.
//
// Invariant: the price for n days must never exceed the price for any m > n
// days at the same rates. So we always also consider "round up to the next
// tier" (next full week, next full month) — a 29-day rental should not cost
// more than a 30-day rental.

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
    // (m) full months cover all n days — pay m × monthly. Catches the 29-day
    // case: 4 weeks + prorated leftover ($497) is worse than 1 month ($450).
    if (m * 30 >= n) {
      if (m * rates.monthly < best) best = m * rates.monthly;
      continue;
    }
    const r = n - m * 30;

    // Tiny remainder: bill those days at the daily rate (per spec, no
    // prorating until the next tier is crossed).
    if (r < 7) {
      const cost = m * rates.monthly + r * rates.daily;
      if (cost < best) best = cost;
    }

    // m months + w weeks (+ leftover at weekly per-diem).
    for (let w = 1; w <= Math.floor(r / 7) + 1; w++) {
      if (w * 7 >= r) {
        // w full weeks cover the remainder — pay w × weekly (round-up).
        const cost = m * rates.monthly + w * rates.weekly;
        if (cost < best) best = cost;
        continue;
      }
      const leftover = r - w * 7;
      const cost =
        m * rates.monthly + w * rates.weekly + leftover * (rates.weekly / 7);
      if (cost < best) best = cost;
    }

    // m months + (remainder × monthly/30) — e.g. 35 = 1 month + 5 monthly-prorated.
    if (m > 0) {
      const monthlyProrated =
        m * rates.monthly + r * (rates.monthly / 30);
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
