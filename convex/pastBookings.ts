// One-shot importer for the historical bookings the manager kept in a
// notebook. Each entry creates a `returned` reservation + a single received
// payment so revenue & settlement reports backfill correctly. Idempotent —
// re-running skips any reservation matching name+start+bike that already
// exists.

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

      // Idempotency: name+start+bike uniquely identifies an imported booking.
      const all = await ctx.db.query("reservations").collect();
      const dup = all.find(
        (r) =>
          r.docFirstName === e.firstName &&
          r.docLastName === e.lastName &&
          r.startDate === e.start &&
          r.bikeId === bike._id
      );
      if (dup) {
        skipped.push(`${e.firstName} ${e.lastName} ${e.start} → already exists (${dup.code})`);
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
        status: "returned",
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
