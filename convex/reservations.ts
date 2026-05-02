import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { computeTotal, daysBetweenISO } from "./lib/pricing";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function genCode(): string {
  const pick = (n: number) =>
    Array.from(
      { length: n },
      () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
    ).join("");
  return `KJ-${pick(4)}-${Math.floor(Math.random() * 900 + 100)}`;
}

const reservationCreateArgs = v.object({
  bikeId: v.id("bikes"),
  startDate: v.string(),
  endDate: v.string(),

  docFirstName: v.string(),
  docLastName: v.string(),
  docNumber: v.string(),
  docExpiry: v.string(),
  docCountry: v.string(),
  docImageId: v.optional(v.id("_storage")),
  docOcrRawJson: v.optional(v.string()),

  phoneCC: v.string(),
  phoneNum: v.string(),
  phoneNote: v.optional(v.string()),

  payMethod: v.string(),

  signatureMode: v.union(v.literal("draw"), v.literal("type")),
  signaturePng: v.optional(v.id("_storage")),
  signatureTyped: v.optional(v.string()),

  deliveryAddr: v.string(),
  deliveryHour: v.number(),
  deliveryDate: v.optional(v.string()),
});

export const create = mutation({
  args: { input: reservationCreateArgs },
  handler: async (ctx, { input }) => {
    const cfg = await ctx.db.query("config").first();
    const rates = {
      daily: cfg?.dailyRate ?? 20,
      weekly: cfg?.weeklyRate ?? 120,
      monthly: cfg?.monthlyRate ?? 450,
    };
    const days = daysBetweenISO(input.startDate, input.endDate);
    if (days < 1) throw new Error("endDate must be after startDate");
    const totalUSD = computeTotal(days, rates);

    // Try a few times in case of code collision.
    let code = genCode();
    for (let i = 0; i < 3; i++) {
      const dup = await ctx.db
        .query("reservations")
        .withIndex("by_code", (q) => q.eq("code", code))
        .first();
      if (!dup) break;
      code = genCode();
    }

    const now = Date.now();
    const id = await ctx.db.insert("reservations", {
      code,
      status: "pending",
      bikeId: input.bikeId,
      startDate: input.startDate,
      endDate: input.endDate,
      days,
      totalUSD,

      docFirstName: input.docFirstName,
      docLastName: input.docLastName,
      docNumber: input.docNumber,
      docExpiry: input.docExpiry,
      docCountry: input.docCountry,
      docImageId: input.docImageId,
      docOcrRawJson: input.docOcrRawJson,

      phoneCC: input.phoneCC,
      phoneNum: input.phoneNum,
      phoneNote: input.phoneNote,

      payMethod: input.payMethod,

      signatureMode: input.signatureMode,
      signaturePng: input.signaturePng,
      signatureTyped: input.signatureTyped,

      deliveryAddr: input.deliveryAddr,
      deliveryHour: input.deliveryHour,
      deliveryDate: input.deliveryDate ?? input.startDate,

      createdAt: now,
      updatedAt: now,
    });

    return { id, code, totalUSD, days };
  },
});

export const byCode = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const r = await ctx.db
      .query("reservations")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    if (!r) return null;
    const bike = await ctx.db.get(r.bikeId);
    return { ...r, bike };
  },
});

export const list = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, { status }) => {
    const all = await ctx.db.query("reservations").order("desc").collect();
    return status ? all.filter((r) => r.status === status) : all;
  },
});

export const attachDoc = mutation({
  args: {
    id: v.id("reservations"),
    storageId: v.optional(v.id("_storage")),
    ocrJson: v.optional(v.string()),
  },
  handler: async (ctx, { id, storageId, ocrJson }) => {
    await ctx.db.patch(id, {
      docImageId: storageId,
      docOcrRawJson: ocrJson,
      updatedAt: Date.now(),
    });
  },
});

export const attachSignature = mutation({
  args: {
    id: v.id("reservations"),
    mode: v.union(v.literal("draw"), v.literal("type")),
    storageId: v.optional(v.id("_storage")),
    typed: v.optional(v.string()),
  },
  handler: async (ctx, { id, mode, storageId, typed }) => {
    await ctx.db.patch(id, {
      signatureMode: mode,
      signaturePng: storageId,
      signatureTyped: typed,
      signedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const setDelivery = mutation({
  args: {
    id: v.id("reservations"),
    addr: v.string(),
    hour: v.number(),
    date: v.optional(v.string()),
  },
  handler: async (ctx, { id, addr, hour, date }) => {
    await ctx.db.patch(id, {
      deliveryAddr: addr,
      deliveryHour: hour,
      deliveryDate: date,
      updatedAt: Date.now(),
    });
  },
});

export const cancel = mutation({
  args: { id: v.id("reservations") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { status: "cancelled", updatedAt: Date.now() });
  },
});

export const setStatus = mutation({
  args: {
    id: v.id("reservations"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("active"),
      v.literal("returned"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, { id, status }) => {
    await ctx.db.patch(id, { status, updatedAt: Date.now() });
  },
});
