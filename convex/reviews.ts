import { v } from "convex/values";
import {
  query,
  mutation,
  internalMutation,
  internalAction,
} from "./_generated/server";
import { internal } from "./_generated/api";

export const fiveStar = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db
      .query("reviews")
      .withIndex("by_rating", (q) => q.eq("rating", 5))
      .collect();
    // Sort by fetchedAt desc — newest reviews surface first regardless of
    // when they were inserted into the DB.
    return all.sort((a, b) => b.fetchedAt - a.fetchedAt).slice(0, 20);
  },
});

const SEED = [
  { googleId: "seed-1", name: "Marina S.", rating: 5, text: "Karen and JJ delivered the moto right to our hostel — surf rack already on, two helmets, full tank. The Genesis was perfect for the dirt roads to Playa Santana.", when: "2 weeks ago" },
  { googleId: "seed-2", name: "Tom R.", rating: 5, text: "Best moto experience in Popoyo. Brand-new electric, charged it once during a 4-day rental. Highly recommend.", when: "1 month ago" },
  { googleId: "seed-3", name: "Léa B.", rating: 5, text: "On honeymoon and these guys made it so easy. Picked us up from the hotel, contract on the phone, done in 10 minutes. The XT 125 handled Guasacate like a dream.", when: "3 weeks ago" },
  { googleId: "seed-4", name: "Diego A.", rating: 5, text: "Rented for 3 weeks and got a great monthly rate. Moto was spotless, helmets actually fit, and they came to swap a tire when I picked up a nail. Real local service.", when: "2 months ago" },
  { googleId: "seed-5", name: "Sophie K.", rating: 5, text: "I was nervous about renting in Nica but Karen walked me through everything. Surf rack fits a 6'2 longboard no problem. Five stars, will be back next dry season.", when: "5 days ago" },
  { googleId: "seed-6", name: "Jonas H.", rating: 5, text: "Quiet, fast, easy. The blue Genesis is silent on the dawn ride to Popoyo Outer Reef — felt like cheating. Fair pricing, zero drama.", when: "6 weeks ago" },
];

export const ensureSeeded = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let inserted = 0;
    for (const r of SEED) {
      const existing = await ctx.db
        .query("reviews")
        .withIndex("by_googleId", (q) => q.eq("googleId", r.googleId))
        .first();
      if (!existing) {
        await ctx.db.insert("reviews", { ...r, fetchedAt: now });
        inserted += 1;
      }
    }
    return inserted;
  },
});

export const upsertMany = mutation({
  args: {
    items: v.array(
      v.object({
        googleId: v.string(),
        name: v.string(),
        rating: v.number(),
        text: v.string(),
        when: v.string(),
        profilePic: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, { items }) => {
    const now = Date.now();
    for (const r of items) {
      const existing = await ctx.db
        .query("reviews")
        .withIndex("by_googleId", (q) => q.eq("googleId", r.googleId))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, { ...r, fetchedAt: now });
      } else {
        await ctx.db.insert("reviews", { ...r, fetchedAt: now });
      }
    }
  },
});

// Stub: in v2 this calls Google Places. For now it just touches fetchedAt
// on seeded rows so cron doesn't fail.
export const refresh = internalAction({
  args: {},
  handler: async (ctx) => {
    await ctx.runMutation(internal.reviews.touchFetchedAt, {});
  },
});

export const touchFetchedAt = internalMutation({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("reviews").collect();
    const now = Date.now();
    for (const r of rows) await ctx.db.patch(r._id, { fetchedAt: now });
  },
});
