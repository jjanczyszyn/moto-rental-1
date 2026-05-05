// Pure helpers used by both queries (read-only metrics) and the admin UI.

export const DEFAULT_JJ_PCT = 70;
export const DEFAULT_KAREN_PCT = 30;

export type Partner = "JJ" | "Karen";

export interface PaymentLike {
  amount: number;
  paymentType: "deposit" | "balance" | "full_payment" | "refund";
  status: "received" | "pending" | "failed" | "cancelled" | "refunded";
  collectedBy: Partner;
  receivedAt?: number;
  method: string;
  reservationId: string;
}

// Signed amount that contributes to revenue: refunds reduce it. Pending /
// failed / cancelled / refunded payments are ignored at the call site.
export function signedAmount(p: PaymentLike): number {
  if (p.status !== "received") return 0;
  return p.paymentType === "refund" ? -Math.abs(p.amount) : Math.abs(p.amount);
}

export interface SettlementSummary {
  totalRevenue: number;
  jjExpected: number;
  karenExpected: number;
  jjCollected: number;
  karenCollected: number;
  // Positive = Karen owes JJ; negative = JJ owes Karen.
  jjBalanceBeforeTransfers: number;
  jjReceivedTransfers: number;
  jjSentTransfers: number;
  jjFinalBalance: number;
  // Convenience labels for the UI.
  label: string;
}

export interface BookingSplitLookup {
  // jjShare/karenShare percentages by reservationId. Falls back to defaults
  // when the booking has no override stored.
  splitFor(reservationId: string): { jjPct: number; karenPct: number };
}

export interface TransferLike {
  fromPartner: Partner;
  toPartner: Partner;
  amount: number;
}

export function summariseSettlement(
  payments: PaymentLike[],
  transfers: TransferLike[],
  splits: BookingSplitLookup
): SettlementSummary {
  let totalRevenue = 0;
  let jjExpected = 0;
  let karenExpected = 0;
  let jjCollected = 0;
  let karenCollected = 0;

  for (const p of payments) {
    const amt = signedAmount(p);
    if (amt === 0) continue;
    totalRevenue += amt;
    const { jjPct, karenPct } = splits.splitFor(p.reservationId);
    jjExpected += (amt * jjPct) / 100;
    karenExpected += (amt * karenPct) / 100;
    if (p.collectedBy === "JJ") jjCollected += amt;
    else karenCollected += amt;
  }

  let jjReceivedTransfers = 0;
  let jjSentTransfers = 0;
  for (const t of transfers) {
    if (t.toPartner === "JJ") jjReceivedTransfers += t.amount;
    if (t.fromPartner === "JJ") jjSentTransfers += t.amount;
  }

  const jjBalanceBeforeTransfers = jjExpected - jjCollected;
  const jjFinalBalance =
    jjExpected - jjCollected - jjReceivedTransfers + jjSentTransfers;

  let label: string;
  if (Math.abs(jjFinalBalance) < 0.01) label = "Settled";
  else if (jjFinalBalance > 0)
    label = `Karen owes JJ ${formatUSD(jjFinalBalance)}`;
  else label = `JJ owes Karen ${formatUSD(Math.abs(jjFinalBalance))}`;

  return {
    totalRevenue,
    jjExpected,
    karenExpected,
    jjCollected,
    karenCollected,
    jjBalanceBeforeTransfers,
    jjReceivedTransfers,
    jjSentTransfers,
    jjFinalBalance,
    label,
  };
}

export function formatUSD(n: number): string {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return `${sign}$${abs.toFixed(2)}`;
}

// 'YYYY-MM-DD' → 'YYYY-MM'
export function isoMonth(iso: string): string {
  return iso.slice(0, 7);
}

// 'YYYY-MM' bounds. monthStartISO is inclusive, monthEndISO is exclusive.
export function monthBoundsISO(year: number, monthIdx0: number): {
  start: string;
  end: string;
} {
  const startY = year;
  const startM = monthIdx0 + 1;
  const endY = monthIdx0 === 11 ? year + 1 : year;
  const endM = monthIdx0 === 11 ? 1 : monthIdx0 + 2;
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    start: `${startY}-${pad(startM)}-01`,
    end: `${endY}-${pad(endM)}-01`,
  };
}

export function daysInMonth(year: number, monthIdx0: number): number {
  return new Date(year, monthIdx0 + 1, 0).getDate();
}
