# Karen & JJ Moto Rental

Customer-facing moto-rental booking flow for Popoyo, Nicaragua.

- **Live site:** [moto.popoyo.co](https://moto.popoyo.co/)
- **Admin panel:** [moto.popoyo.co/#/admin](https://moto.popoyo.co/#/admin) — password-gated (owner credentials, see local notes / `src/screens/Admin.tsx`)

## Local development

```sh
npm install

# Backend (Convex dev deployment) in one terminal
npm run convex:dev

# Frontend in another
npm run dev   # → http://localhost:5173
```

Tests:
```sh
npm test           # vitest, all green = ship-ready
npm run typecheck
npm run build      # production bundle
```

## Stack

| Layer | Choice |
|---|---|
| Frontend | Vite + React + TypeScript, hosted on GitHub Pages |
| Backend | Convex — schema, queries, mutations, scheduled functions |
| Payments | Display-only contact details (Cash, Venmo, Zelle, PayPal, Wise, Revolut, Apple Pay, bank transfer). Confirmation happens out-of-band over WhatsApp. |
| OCR | tesseract.js in-browser, parser at `src/lib/ocrParse.ts` (TD3 + TD1 MRZ + visual-zone heuristics) |

## Deployment topology

- **GitHub Pages**: workflow at `.github/workflows/deploy.yml` builds on push to `main` and serves `moto.popoyo.co` (custom domain, `public/CNAME`).
- **Convex prod**: deployment `tough-meadowlark-233`. Live site reads from this. Update with `CONVEX_DEPLOY_KEY=<prod key> npx convex deploy`, then `npx convex run --prod seed:all '{}'` to re-seed bikes / reviews / payment methods.
- **Convex dev**: deployment `third-kookabura-106`. Local development only — edits in this dashboard do **not** propagate to the live site. See [CLAUDE.md](./CLAUDE.md).

## Layout

```
src/
  App.tsx                     # router (mobile vs desktop branches), reservation flow shell
  components/
    BikeIllustration.tsx      # bike SVG/photo + style-by-slug
    CountrySelect.tsx         # searchable flag-and-name dropdown
    ExpiryField.tsx           # dd-mm-YYYY ↔ ISO date input
    PaymentIcon.tsx           # cash emoji + brand SVGs (venmo/zelle/paypal/wise/revolut/applepay)
    Common.tsx, Icons.tsx
  screens/                    # one file per step in the rental flow
    Home.tsx Calendar.tsx BikePick.tsx OCR.tsx Phone.tsx
    Payment.tsx Contract.tsx Delivery.tsx Done.tsx Admin.tsx
  hooks/useReservationDraft.ts
  lib/                        # pure logic with vitest coverage
    pricing.ts dates.ts countries.ts ocrParse.ts phone.ts assets.ts
convex/
  schema.ts                   # config / bikes / reservations / reviews
  config.ts bikes.ts reservations.ts reviews.ts
  contract.ts ocr.ts storage.ts crons.ts seed.ts
  lib/pricing.ts              # shared with frontend
public/
  assets/                     # bike photos, logo, helmet, payment brand SVGs
  CNAME                       # custom domain pin
tests-local/                  # gitignored — see CLAUDE.md
```

## Project conventions

See [CLAUDE.md](./CLAUDE.md) for the rules followed when working on this repo
(no secrets / personal documents in commits, dev-vs-prod Convex split, etc.).
