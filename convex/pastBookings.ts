// One-shot importer for the historical bookings the manager kept in a
// notebook. Each entry creates a `returned` reservation + a single received
// payment so revenue & settlement reports backfill correctly. Idempotent —
// re-running skips any reservation matching name+start+bike that already
// exists.

import { v } from "convex/values";
import { mutation } from "./_generated/server";

type Collector = "JJ" | "Karen";

interface Entry {
  firstName: string;
  lastName: string;
  slug: "genesis-blue" | "genesis-red" | "yamaha-xt";
  start: string; // ISO YYYY-MM-DD inclusive
  end: string;   // ISO YYYY-MM-DD exclusive
  total: number;
  method: string;
  collectedBy: Collector;
  note?: string;
  // Defaults to "returned". Override for paid-but-not-yet-completed
  // bookings ("confirmed") or anything else outside the typical past-record
  // shape.
  status?: "pending" | "confirmed" | "active" | "returned" | "cancelled";
}

// genesis azul → genesis-blue, genesis Rosa → genesis-red, Yamaha → yamaha-xt.
const ENTRIES: Entry[] = [
  { firstName: "Ori", lastName: "Sailes", slug: "genesis-blue", start: "2025-06-15", end: "2025-06-19", total: 80, method: "cash", collectedBy: "Karen" },
  { firstName: "Almog", lastName: "Robinson", slug: "genesis-red", start: "2025-06-16", end: "2025-06-18", total: 40, method: "cash", collectedBy: "Karen" },
  // Shachaf rented both Genesis bikes the same week — split into two records.
  { firstName: "Shachaf", lastName: "Poraz", slug: "genesis-blue", start: "2025-06-19", end: "2025-06-22", total: 60, method: "cash", collectedBy: "Karen", note: "Group booking 1 of 2 bikes" },
  { firstName: "Shachaf", lastName: "Poraz", slug: "genesis-red", start: "2025-06-19", end: "2025-06-22", total: 60, method: "cash", collectedBy: "Karen", note: "Group booking 2 of 2 bikes" },
  { firstName: "Lucy", lastName: "Lewis", slug: "genesis-blue", start: "2025-06-22", end: "2025-06-23", total: 20, method: "cash", collectedBy: "Karen" },
  { firstName: "Neuman Joseph", lastName: "Aaron", slug: "genesis-blue", start: "2025-07-01", end: "2025-07-03", total: 40, method: "cash", collectedBy: "Karen" },
  // Source said 02/07/26-06/07/25 — assumed both 2025 (matches 4 days × $20 = $80).
  { firstName: "Harel", lastName: "Yakinm", slug: "genesis-red", start: "2025-07-02", end: "2025-07-06", total: 80, method: "cash", collectedBy: "Karen" },
  { firstName: "Fogel", lastName: "Tubal", slug: "yamaha-xt", start: "2025-07-02", end: "2025-07-07", total: 100, method: "cash", collectedBy: "Karen" },
  { firstName: "Mike", lastName: "", slug: "yamaha-xt", start: "2025-07-11", end: "2025-07-17", total: 120, method: "cash", collectedBy: "Karen" },
  { firstName: "Alfa", lastName: "Italy", slug: "genesis-red", start: "2025-07-09", end: "2025-07-14", total: 100, method: "cash", collectedBy: "Karen" },
  { firstName: "Yehouda Tomer", lastName: "Sail", slug: "genesis-blue", start: "2025-07-09", end: "2025-07-13", total: 80, method: "cash", collectedBy: "Karen" },
  // Source said 20/07/25-/07/25 — end date inferred from $60 = 3 days × $20.
  { firstName: "Ezra", lastName: "Yali", slug: "genesis-blue", start: "2025-07-20", end: "2025-07-23", total: 60, method: "cash", collectedBy: "Karen", note: "End date inferred from amount (3 days × $20)" },
  // Source said 20/07/25-25/07/26 — second year a typo, both 2025.
  { firstName: "Ezra", lastName: "Yali", slug: "genesis-red", start: "2025-07-20", end: "2025-07-25", total: 100, method: "cash", collectedBy: "Karen" },
  { firstName: "Cohen", lastName: "NYU", slug: "yamaha-xt", start: "2025-07-22", end: "2025-07-26", total: 80, method: "cash", collectedBy: "Karen" },
  { firstName: "Lauriano Andrés", lastName: "Delgado", slug: "genesis-red", start: "2025-07-31", end: "2025-08-03", total: 60, method: "cash", collectedBy: "Karen" },
  { firstName: "Adan", lastName: "Leshem", slug: "yamaha-xt", start: "2025-08-03", end: "2025-08-05", total: 40, method: "cash", collectedBy: "Karen" },
  { firstName: "Thomas", lastName: "Jamer", slug: "yamaha-xt", start: "2025-08-06", end: "2025-08-10", total: 80, method: "cash", collectedBy: "Karen" },
  { firstName: "Adan", lastName: "Leshem", slug: "yamaha-xt", start: "2025-08-28", end: "2025-08-31", total: 60, method: "cash", collectedBy: "Karen" },
  // Daniel Karl — long-term Nov→Dec rental, paid $400 by Wise.
  { firstName: "Daniel", lastName: "Karl", slug: "genesis-blue", start: "2025-11-04", end: "2025-12-18", total: 400, method: "wise", collectedBy: "JJ", note: "Pago por Wise" },
  { firstName: "Melanie", lastName: "Velasquez", slug: "genesis-red", start: "2025-11-12", end: "2025-11-14", total: 40, method: "cash", collectedBy: "Karen" },
  { firstName: "Jonathan", lastName: "Cahill", slug: "yamaha-xt", start: "2025-11-17", end: "2025-11-23", total: 80, method: "cash", collectedBy: "Karen" },
  { firstName: "Jana", lastName: "Schilling", slug: "yamaha-xt", start: "2025-12-22", end: "2025-12-29", total: 120, method: "cash", collectedBy: "Karen" },

  // ── Second batch (notebook entries spanning Jun 2025 → Apr 2026). ────────
  { firstName: "John", lastName: "Lloyd", slug: "yamaha-xt", start: "2025-06-21", end: "2025-06-23", total: 60, method: "cash", collectedBy: "Karen" },
  { firstName: "Enrique", lastName: "Zolnatho", slug: "yamaha-xt", start: "2025-08-25", end: "2025-08-27", total: 40, method: "cash", collectedBy: "Karen" },
  // Source said 12/09/26-26/09/25 — first year a typo, both 2025.
  { firstName: "Lodwin", lastName: "Schlegel", slug: "yamaha-xt", start: "2025-09-12", end: "2025-09-26", total: 120, method: "cash", collectedBy: "Karen" },
  { firstName: "Paris", lastName: "D", slug: "genesis-blue", start: "2025-10-11", end: "2025-10-17", total: 100, method: "cash", collectedBy: "Karen" },
  { firstName: "Clement", lastName: "Couzin", slug: "genesis-red", start: "2025-11-18", end: "2025-11-21", total: 54, method: "cash", collectedBy: "Karen" },
  // Source said 8/02/26-7/02/26 (end before start). 19 days × $20 = $380 →
  // end inferred as 27/02/26.
  { firstName: "Philippe", lastName: "Cardigan", slug: "yamaha-xt", start: "2026-02-08", end: "2026-02-27", total: 380, method: "cash", collectedBy: "Karen", note: "End date inferred from amount (19 days × $20)" },
  { firstName: "Lex", lastName: "Heinem", slug: "genesis-red", start: "2026-02-21", end: "2026-02-28", total: 120, method: "cash", collectedBy: "Karen" },
  { firstName: "Woodson", lastName: "Hunters", slug: "yamaha-xt", start: "2026-03-07", end: "2026-03-12", total: 100, method: "cash", collectedBy: "Karen" },
  { firstName: "Andrea", lastName: "Hacnsi", slug: "genesis-red", start: "2026-03-14", end: "2026-03-16", total: 40, method: "cash", collectedBy: "Karen" },
  { firstName: "Leam", lastName: "", slug: "genesis-red", start: "2026-03-17", end: "2026-03-19", total: 40, method: "cash", collectedBy: "Karen" },
  { firstName: "Katherine", lastName: "Gonzales", slug: "yamaha-xt", start: "2026-03-18", end: "2026-03-25", total: 120, method: "cash", collectedBy: "Karen" },
  { firstName: "Dino", lastName: "Molina", slug: "yamaha-xt", start: "2026-04-11", end: "2026-04-15", total: 80, method: "cash", collectedBy: "Karen" },
  { firstName: "Serjiv", lastName: "Menahem", slug: "genesis-blue", start: "2026-04-13", end: "2026-04-18", total: 100, method: "cash", collectedBy: "Karen" },
  // Source said 21/04/2026 only — end inferred from $100 = 5 days × $20.
  { firstName: "Segui", lastName: "Abraham", slug: "genesis-red", start: "2026-04-21", end: "2026-04-26", total: 100, method: "cash", collectedBy: "Karen", note: "End date inferred from amount (5 days × $20)" },
  // Source said 23/04/26-23/04/26 (zero-day) — end inferred from $60 = 3
  // days × $20.
  { firstName: "Ethan", lastName: "", slug: "genesis-blue", start: "2026-04-23", end: "2026-04-26", total: 60, method: "cash", collectedBy: "Karen", note: "End date inferred from amount (3 days × $20)" },
  // Katherine extended through 11/05/26. Source typo "11/04/26" treated as
  // "11/05/26" since extension date can't precede the original start.
  { firstName: "Katherine", lastName: "Gonzales", slug: "yamaha-xt", start: "2026-04-27", end: "2026-05-11", total: 240, method: "cash", collectedBy: "Karen", note: "Extended in-place from 04/05/26 → 11/05/26" },

  // ── Third batch. ─────────────────────────────────────────────────────────
  { firstName: "Roli", lastName: "Tailed", slug: "yamaha-xt", start: "2025-06-03", end: "2025-06-06", total: 60, method: "cash", collectedBy: "Karen" },
  // Single-date entry — 1 day × $20 = $20.
  { firstName: "Rotem", lastName: "Solomon", slug: "yamaha-xt", start: "2025-06-29", end: "2025-06-30", total: 20, method: "cash", collectedBy: "Karen", note: "Single-day rental" },
  { firstName: "Madeline", lastName: "Hatrick", slug: "genesis-red", start: "2025-10-05", end: "2025-10-19", total: 180, method: "cash", collectedBy: "Karen" },
  // Cross-year rental.
  { firstName: "Yael", lastName: "Tenanboin", slug: "genesis-blue", start: "2025-12-28", end: "2026-01-02", total: 100, method: "cash", collectedBy: "Karen" },

  // Nacho — both Genesis bikes for a week, paid $240 via PayPal. Split per
  // bike (one record each at the weekly rate).
  { firstName: "Nacho", lastName: "", slug: "genesis-blue", start: "2026-04-02", end: "2026-04-09", total: 120, method: "paypal", collectedBy: "JJ", note: "Group booking 1 of 2 bikes ($240 PayPal split across both)" },
  { firstName: "Nacho", lastName: "", slug: "genesis-red", start: "2026-04-02", end: "2026-04-09", total: 120, method: "paypal", collectedBy: "JJ", note: "Group booking 2 of 2 bikes ($240 PayPal split across both)" },

  { firstName: "Johannes", lastName: "Scherer", slug: "genesis-blue", start: "2026-05-02", end: "2026-05-05", total: 60, method: "cash", collectedBy: "Karen" },
  { firstName: "Angel", lastName: "Z", slug: "genesis-red", start: "2026-05-03", end: "2026-05-05", total: 40, method: "cash", collectedBy: "Karen" },
  { firstName: "Francois", lastName: "Corentin", slug: "yamaha-xt", start: "2026-01-17", end: "2026-01-24", total: 120, method: "cash", collectedBy: "Karen" },

  // Antony Tester · Yamaha · 18/05/25 → 24/05/25 · $120 (1 week).
  { firstName: "Antony", lastName: "Tester", slug: "yamaha-xt", start: "2025-05-18", end: "2025-05-24", total: 120, method: "cash", collectedBy: "Karen" },
  // Roli Tailed (spelled "Tailer" in this entry — same customer as the
  // earlier 03/06/25 booking; using the prior spelling for consistency).
  { firstName: "Roli", lastName: "Tailed", slug: "yamaha-xt", start: "2025-05-25", end: "2025-05-28", total: 60, method: "cash", collectedBy: "Karen" },
  // Vojieten · Yamaha · 11/04/25 → 17/05/25 · $350 via PayPal to JJ.
  // 36-day rental at a special rate (auto-pricing would be ~$540).
  { firstName: "Vojieten", lastName: "Ksvarik", slug: "yamaha-xt", start: "2025-04-11", end: "2025-05-17", total: 350, method: "paypal", collectedBy: "JJ", note: "$350 PayPal upfront for 36-day rental (special rate)." },
];

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function genCode(): string {
  const pick = (n: number) =>
    Array.from(
      { length: n },
      () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
    ).join("");
  return `KJ-${pick(4)}-${Math.floor(Math.random() * 900 + 100)}`;
}

// One-off cleanup. Deletes a reservation by code along with any payments
// it owns. Used to remove a duplicate that the original importer created
// before we tightened the idempotency check.
export const deleteByCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const reservation = await ctx.db
      .query("reservations")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    if (!reservation) return { deleted: false, reason: "Not found" };
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_reservation", (q) => q.eq("reservationId", reservation._id))
      .collect();
    for (const p of payments) await ctx.db.delete(p._id);
    await ctx.db.delete(reservation._id);
    return {
      deleted: true,
      code,
      name: `${reservation.docFirstName} ${reservation.docLastName}`,
      paymentsDeleted: payments.length,
    };
  },
});

export const importHistorical = mutation({
  args: {},
  handler: async (ctx) => {
    const bikes = await ctx.db.query("bikes").collect();
    const bySlug = new Map(bikes.map((b) => [b.slug, b]));
    const cfg = await ctx.db.query("config").first();
    const jjPct = cfg?.jjSharePercentage ?? 70;
    const karenPct = cfg?.karenSharePercentage ?? 30;
    const dailyRate = cfg?.dailyRate ?? 20;

    const created: string[] = [];
    const skipped: string[] = [];

    for (const e of ENTRIES) {
      const bike = bySlug.get(e.slug);
      if (!bike) {
        skipped.push(`${e.firstName} ${e.lastName}: bike slug "${e.slug}" not found`);
        continue;
      }

      // Idempotency. Two different customers booking the same bike on the
      // exact same start date is essentially never going to happen, so we
      // dedupe on (firstName, startDate, bikeId). lastName is excluded
      // because the customer-flow stores the full passport name (e.g.
      // "Isabel Tellez Gonzales") which won't match a notebook shorthand
      // like "Gonzales".
      const all = await ctx.db.query("reservations").collect();
      const dup = all.find(
        (r) =>
          r.startDate === e.start &&
          r.bikeId === bike._id &&
          r.docFirstName.toLowerCase() === e.firstName.toLowerCase()
      );
      if (dup) {
        skipped.push(`${e.firstName} ${e.lastName} ${e.start} → already exists (${dup.code} · ${dup.docFirstName} ${dup.docLastName})`);
        continue;
      }

      const days = Math.round((Date.parse(e.end) - Date.parse(e.start)) / 86400000);
      if (days < 1) {
        skipped.push(`${e.firstName} ${e.lastName} ${e.start}: end before start`);
        continue;
      }

      // Generate a non-colliding reservation code.
      let code = genCode();
      for (let i = 0; i < 5; i++) {
        const exists = await ctx.db
          .query("reservations")
          .withIndex("by_code", (q) => q.eq("code", code))
          .first();
        if (!exists) break;
        code = genCode();
      }

      const now = Date.now();
      const reservationId = await ctx.db.insert("reservations", {
        code,
        status: e.status ?? "returned",
        bikeId: bike._id,
        startDate: e.start,
        endDate: e.end,
        days,
        totalUSD: e.total,
        dailyRateUSD: dailyRate,
        jjSharePct: jjPct,
        karenSharePct: karenPct,

        docFirstName: e.firstName,
        docLastName: e.lastName,
        docNumber: "",
        docExpiry: "",
        docCountry: "",

        phoneCC: "",
        phoneNum: "",

        payMethod: e.method,

        signatureMode: "type",

        deliveryAddr: "",
        deliveryHour: 10,

        source: "walk_in",
        notes: e.note ?? "Imported from past records",

        createdAt: now,
        updatedAt: now,
      });

      // Single received payment dated to the start of the rental — best
      // approximation since hand-off is when cash typically changes hands.
      const receivedAt = Date.parse(e.start + "T12:00:00Z");
      await ctx.db.insert("payments", {
        reservationId,
        amount: e.total,
        currency: "USD",
        method: e.method,
        collectedBy: e.collectedBy,
        paymentType: "full_payment",
        status: "received",
        receivedAt,
        notes: e.note,
        createdAt: now,
        updatedAt: now,
      });

      created.push(`${code} · ${e.firstName} ${e.lastName} · ${e.start} → ${e.end} · $${e.total}`);
    }

    return {
      attempted: ENTRIES.length,
      created: created.length,
      skipped: skipped.length,
      createdList: created,
      skippedList: skipped,
    };
  },
});
