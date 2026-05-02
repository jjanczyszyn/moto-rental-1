import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("bikes").collect();
    return rows.filter((b) => b.isActive);
  },
});

export const availability = query({
  args: { startDate: v.string(), endDate: v.string() },
  handler: async (ctx, { startDate, endDate }) => {
    const bikes = await ctx.db.query("bikes").collect();
    // Reservations that overlap with [startDate, endDate) and are not cancelled.
    const reservations = await ctx.db.query("reservations").collect();
    const blocking = reservations.filter(
      (r) =>
        r.status !== "cancelled" &&
        r.status !== "returned" &&
        // overlap test: r.startDate < endDate && r.endDate > startDate
        r.startDate < endDate &&
        r.endDate > startDate
    );
    const busyByBike = new Set<string>(blocking.map((r) => r.bikeId));
    return bikes
      .filter((b) => b.isActive)
      .map((b) => ({ bikeId: b._id, available: !busyByBike.has(b._id) }));
  },
});

const SEED = [
  {
    slug: "genesis-red",
    name: "Genesis KLIK",
    color: "Red",
    type: "Electric" as const,
    plate: "POP-217",
    range: "70 km range",
    image: "assets/genesis-red.png",
    isActive: true,
  },
  {
    slug: "genesis-blue",
    name: "Genesis KLIK",
    color: "Blue",
    type: "Electric" as const,
    plate: "POP-184",
    range: "70 km range",
    image: "assets/genesis-blue.png",
    isActive: true,
  },
  {
    slug: "yamaha-xt",
    name: "Yamaha XT 125",
    color: "White",
    type: "Gas" as const,
    plate: "POP-302",
    range: "125cc · 4-speed",
    image: "assets/yamaha-xt125.png",
    isActive: true,
  },
];

export const ensureSeeded = mutation({
  args: {},
  handler: async (ctx) => {
    const inserted: Id<"bikes">[] = [];
    for (const b of SEED) {
      const existing = await ctx.db
        .query("bikes")
        .withIndex("by_slug", (q) => q.eq("slug", b.slug))
        .first();
      if (!existing) {
        const id = await ctx.db.insert("bikes", b);
        inserted.push(id);
      }
    }
    return inserted;
  },
});

export const setActive = mutation({
  args: { bikeId: v.id("bikes"), isActive: v.boolean() },
  handler: async (ctx, { bikeId, isActive }) => {
    await ctx.db.patch(bikeId, { isActive });
  },
});
