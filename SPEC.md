# Karen & JJ Moto Rental — Backend Spec (Convex)

This document hands the **moto-rental-1** prototype off to Claude Code to wire up the
Convex backend, real OCR, and payments. The HTML/JSX in this repo is the design
spec — match its flow exactly. Anything below labelled **MOCKED** is the contract
that the backend must fulfil.

---

## 1. Tech stack

| Layer | Choice |
|---|---|
| Frontend (current) | React via Babel-in-browser + JSX (`index.html` + `*.jsx`) |
| Frontend (target)  | Vite + React + TypeScript, hosted on **GitHub Pages** |
| Backend            | **Convex** — schema, queries, mutations, scheduled functions |
| Payments           | No card processing in v1 — payment methods are display-only contact details (Cash/Zelle/Wise/Revolut/Venmo/PayPal). Payment _confirmation_ happens out-of-band over WhatsApp. |


---

## 2. Convex schema (`convex/schema.ts`)

```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ── Pricing & config (single document table) ──────────────────────
  config: defineTable({
    dailyRate:      v.number(),  // USD
    weeklyRate:     v.number(),
    monthlyRate:    v.number(),
    deliveryStart:  v.number(),  // hour 0-23, default 7
    deliveryEnd:    v.number(),  // hour 0-23, default 20
    deposit:        v.number(),  // USD, default 100
    contractTerms:  v.string(),  // markdown
    paymentMethods: v.array(v.object({
      id:     v.string(),
      label:  v.string(),
      sub:    v.string(),
      detail: v.array(v.string()),
      enabled: v.boolean(),
    })),
  }),

  // ── Fleet ─────────────────────────────────────────────────────────
  bikes: defineTable({
    slug:        v.string(),         // 'genesis-red' | 'genesis-blue' | 'yamaha-xt'
    name:        v.string(),         // 'Genesis KLIK'
    color:       v.string(),         // 'Red'
    type:        v.union(v.literal("Electric"), v.literal("Gas")),
    plate:       v.string(),         // 'POP-217'
    range:       v.string(),         // '70 km range' or '125cc · 4-speed'
    image:       v.string(),         // public URL or storage key
    isActive:    v.boolean(),        // owner can hide a bike
  })
    .index("by_slug", ["slug"]),

  // ── Reservations ──────────────────────────────────────────────────
  reservations: defineTable({
    code:           v.string(),        // 'KJ-A1B2-345' — surfaced to user
    status:         v.union(           // state machine
      v.literal("pending"),            // user picked dates+bike, hasn't paid
      v.literal("confirmed"),          // owner approved over WhatsApp
      v.literal("active"),             // moto delivered
      v.literal("returned"),           // moto returned, deposit handling
      v.literal("cancelled")
    ),

    bikeId:         v.id("bikes"),
    startDate:      v.string(),        // ISO YYYY-MM-DD
    endDate:        v.string(),        // ISO YYYY-MM-DD (exclusive)
    days:           v.number(),        // computed
    totalUSD:       v.number(),        // computed by computePrice()

    // Renter (from OCR)
    docFirstName:   v.string(),
    docLastName:    v.string(),
    docNumber:      v.string(),
    docExpiry:      v.string(),        // ISO YYYY-MM-DD
    docCountry:     v.string(),
    docImageId:     v.optional(v.id("_storage")),  // original upload
    docOcrRawJson:  v.optional(v.string()),        // full OCR response for audit

    // Contact
    phoneCC:        v.string(),        // '+505'
    phoneNum:       v.string(),        // digits only
    phoneNote:      v.optional(v.string()),  // shown when number was flagged short

    // Payment
    payMethod:      v.string(),        // 'cash' | 'zelle' | 'wise' | …
    paidAt:         v.optional(v.number()),
    paidConfirmedBy: v.optional(v.string()), // owner name who confirmed

    // Contract
    signatureMode:  v.union(v.literal("draw"), v.literal("type")),
    signaturePng:   v.optional(v.id("_storage")),  // canvas export
    signatureTyped: v.optional(v.string()),
    contractPdfId:  v.optional(v.id("_storage")),  // generated server-side
    signedAt:       v.optional(v.number()),

    // Delivery
    deliveryAddr:   v.string(),
    deliveryHour:   v.number(),        // 7..20
    deliveryDate:   v.optional(v.string()), // defaults to startDate

    createdAt:      v.number(),
    updatedAt:      v.number(),
  })
    .index("by_code", ["code"])
    .index("by_phone", ["phoneCC", "phoneNum"])
    .index("by_status", ["status"])
    .index("by_bike_dates", ["bikeId", "startDate"]),

  // ── Reviews (cached from Google Places) ───────────────────────────
  reviews: defineTable({
    googleId:    v.string(),  // unique id from Places API
    name:        v.string(),
    rating:      v.number(),  // 1..5
    text:        v.string(),
    when:        v.string(),  // 'a week ago' as returned by Google
    profilePic:  v.optional(v.string()),
    fetchedAt:   v.number(),
  })
    .index("by_rating", ["rating"])
    .index("by_googleId", ["googleId"]),
});
```

---

## 3. Convex functions

### Queries
- `config.get()` → returns the single config row. **Frontend reads pricing from this on every screen** instead of the current `TWEAK_DEFAULTS` block.
- `bikes.list()` → all `isActive: true` bikes.
- `bikes.availability(args: { startDate, endDate })` → returns `{ bikeId, available }[]`. Cross-references active reservations to mark each bike free/busy.
- `reviews.fiveStar()` → `where(rating === 5) order(desc fetchedAt) limit(20)`. The home carousel calls this.
- `reservations.byCode({ code })` → for the confirmation screen and owner inbox.

### Mutations
- `reservations.create(input)` — creates a `pending` row. Returns `{ id, code }`.
- `reservations.attachDoc({ id, storageId, ocrJson })`.
- `reservations.attachSignature({ id, mode, storageId?, typed? })`.
- `reservations.setDelivery({ id, addr, hour, date })`.
- `reservations.cancel({ id })`.

### Actions (run outside the deterministic context — can call external APIs)
- `contract.generatePdf({ reservationId })` → renders a PDF server-side (using `@react-pdf/renderer` or similar) and stores it; messages the owner over WhatsApp with the link.
- `reviews.refresh()` — cron, daily — pulls latest 5★ reviews from https://share.google/IXOC6DlEv7Zk9d18W and upserts into `reviews` table.


---

## 4. Pricing logic

The frontend currently does this in `app.jsx`:

```js
pricing.computeTotal(n) {
  if (n < 7) return n * daily;
  // try every combo of months + weeks + (leftover days at weekly per-diem)
  // and at every months count, also try "monthly + remainder × monthly/30"
  // return the cheapest
}
```

Move this to a Convex helper `lib/pricing.ts` so frontend and backend use the
same function. Server must always be the source of truth — the client price is a
display estimate; the mutation re-computes from `config.get()` and overwrites
`totalUSD`.

Concrete numbers (with $20/$120/$450 defaults):
- 7 days = $120
- 11 days = ≈$189 (= $120 + 4 × $120/7)
- 14 days = $240 (2 × week)
- 30 days = $450 (1 × month)
- 35 days = $525 (= $450 + 5 × $450/30)

---

## 5. OCR contract

Mock today: `OCRScreen` shows a "scanning…" state for ~1.6s then fills random
fake data. Replace with:

1. User picks a file → upload to Convex storage via `useUploadFile`.
2. Frontend calls `ocr.extractFromImage` action.
3. Action calls the chosen vision API and normalises to:




4. Frontend pre-fills the editable fields. User can correct anything.

Use `tesseract.js` in-browser

```ts
{
  firstName: string;
  lastName:  string;       // multiple last names joined with space
  docNumber: string;
  expiryISO: string;       // 'YYYY-MM-DD'
  country:   string;       // ISO country name
  rawJson:   string;       // for audit
}
```

If something fails ask the user to fill the fields themselves before moving to the next step.
---

## 6. Reservation state machine

```
[user]                  [owner]                [system]
  │                        │                       │
  ▼                        │                       │
pending  ──────WhatsApp──→ confirms? ──yes──→  confirmed
  │                        │                       │
  │                        │  delivers moto    ┌───┘
  │                        ├──────────────────→ active
  │                        │                       │
  │                        │  receives moto    ┌───┘
  │                        ├──────────────────→ returned
  │                        │                       │
  │                        │  refund deposit
  └──cancel→ cancelled
```

The frontend "Confirmation" screen lands on `pending`. The owner reviews in
their inbox (a separate `/admin` route, password-gated) and flips to `confirmed`.

---

## 7. Frontend → backend wiring map

| Screen | Currently | Replace with |
|---|---|---|
| Home — pricing pills | `tweaks.dailyRate` etc. | `useQuery(api.config.get)` |
| Home — fleet carousel | `BIKE_FLEET` const in `bikes.jsx` | `useQuery(api.bikes.list)` |
| Home — reviews carousel | hardcoded `REVIEWS` in `screens-home.jsx` | `useQuery(api.reviews.fiveStar)` |
| Calendar | local state | local state until step 2 (bike pick), then `availability` query |
| Bike pick | `BIKE_FLEET` filter by `available` | `useQuery(api.bikes.availability, { startDate, endDate })` |
| OCR | `setTimeout(1600)` fake fill | upload + `useAction(api.ocr.extractFromImage)` |
| Phone | local state | accumulates into reservation draft |
| Payment | local state | accumulates |
| Contract | `<canvas>` for signature | export canvas to PNG, upload to storage |
| Confirmation | `Math.random()` reservation code | `useMutation(api.reservations.create)` returns server-generated `code` |

Build a single client-side `useReservationDraft()` hook that accumulates state
across screens and only persists to Convex on the **Confirm reservation**
button at the end of the delivery step. This avoids partial reservations
cluttering the DB.

---

## 8. Admin / owner views (out of scope for v1, plan for v2)

- `/admin` — list of upcoming reservations grouped by day
- Toggle bike availability on/off
- Edit pricing in `config` table directly
- Mark reservations as paid/active/returned
- View the contract PDF and signature for any reservation

Auth: Convex's built-in auth with a single allow-list of owner phone numbers
(`+50589750052`, `+16469340781`). and hardcoded passwords: (`Karen-esta-Fuert3`, `JJ-is-f0rmidable`)

---

## 9. Deployment

| Piece | Where | How |
|---|---|---|
| Static frontend | GitHub Pages | `npm run build` → `dist/` → push to `gh-pages` branch (or Pages action) |
| Convex | Convex Cloud | `npx convex deploy` |
| Env vars on frontend | `VITE_CONVEX_URL` | committed to repo (it's a public URL) |

For the current Babel-in-browser prototype, GitHub Pages can serve `index.html`
directly — no build step needed. See `README.md`.

---

## 10. Migration plan for Claude Code

1. **Don't rewrite the UI** — port the existing JSX components into a Vite + TS
   project as-is. Drop Babel-in-browser, add proper imports.
2. Wrap `<App>` in `<ConvexProvider client={convex}>`.
3. Replace each hardcoded list with a `useQuery` (table above).
4. Add the `useReservationDraft()` hook and wire mutations on the final step.
5. Build the OCR action — start with `tesseract.js` to keep it free;
6. Build the `/admin` view.
7. Add tests on `lib/pricing.ts` — the optimal-bundle algorithm is non-trivial
   and we don't want regressions.


