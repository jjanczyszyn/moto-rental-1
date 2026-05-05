import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { assertAdmin } from "./admin";

// The config row is always present after `seed:all` runs at deploy time.
// Returning `null` is safe — every consumer already uses optional chaining
// while the query is loading.
export const get = query({
  args: {},
  handler: async (ctx): Promise<Doc<"config"> | null> => {
    return await ctx.db.query("config").first();
  },
});

export const updateBusiness = mutation({
  args: {
    adminToken: v.string(),
    businessName: v.optional(v.string()),
    currency: v.optional(v.string()),
    timezone: v.optional(v.string()),
    dailyRate: v.optional(v.number()),
    weeklyRate: v.optional(v.number()),
    monthlyRate: v.optional(v.number()),
    deposit: v.optional(v.number()),
    jjSharePercentage: v.optional(v.number()),
    karenSharePercentage: v.optional(v.number()),
  },
  handler: async (ctx, { adminToken, ...patch }) => {
    await assertAdmin(ctx, adminToken);
    const cfg = await ctx.db.query("config").first();
    if (!cfg) throw new Error("Config row missing — run seed.all first.");
    if (
      patch.jjSharePercentage !== undefined &&
      patch.karenSharePercentage !== undefined &&
      patch.jjSharePercentage + patch.karenSharePercentage !== 100
    ) {
      throw new Error("JJ + Karen share must equal 100%.");
    }
    const next: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(patch)) {
      if (val !== undefined) next[k] = val;
    }
    await ctx.db.patch(cfg._id, next);
  },
});

export const setPaymentMethodCollector = mutation({
  args: {
    adminToken: v.string(),
    methodId: v.string(),
    defaultCollector: v.union(
      v.literal("JJ"),
      v.literal("Karen"),
      v.literal("manual")
    ),
  },
  handler: async (ctx, { adminToken, methodId, defaultCollector }) => {
    await assertAdmin(ctx, adminToken);
    const cfg = await ctx.db.query("config").first();
    if (!cfg) throw new Error("Config row missing — run seed.all first.");
    const next = cfg.paymentMethods.map((m) =>
      m.id === methodId ? { ...m, defaultCollector } : m
    );
    await ctx.db.patch(cfg._id, { paymentMethods: next });
  },
});
