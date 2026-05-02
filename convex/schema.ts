import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  config: defineTable({
    dailyRate: v.number(),
    weeklyRate: v.number(),
    monthlyRate: v.number(),
    deliveryStart: v.number(),
    deliveryEnd: v.number(),
    deposit: v.number(),
    contractTerms: v.string(),
    paymentMethods: v.array(
      v.object({
        id: v.string(),
        label: v.string(),
        sub: v.string(),
        detail: v.array(v.string()),
        enabled: v.boolean(),
      })
    ),
  }),

  bikes: defineTable({
    slug: v.string(),
    name: v.string(),
    color: v.string(),
    type: v.union(v.literal("Electric"), v.literal("Gas")),
    plate: v.string(),
    range: v.string(),
    image: v.string(),
    isActive: v.boolean(),
  }).index("by_slug", ["slug"]),

  reservations: defineTable({
    code: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("active"),
      v.literal("returned"),
      v.literal("cancelled")
    ),

    bikeId: v.id("bikes"),
    startDate: v.string(),
    endDate: v.string(),
    days: v.number(),
    totalUSD: v.number(),

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
    paidAt: v.optional(v.number()),
    paidConfirmedBy: v.optional(v.string()),

    signatureMode: v.union(v.literal("draw"), v.literal("type")),
    signaturePng: v.optional(v.id("_storage")),
    signatureTyped: v.optional(v.string()),
    contractPdfId: v.optional(v.id("_storage")),
    signedAt: v.optional(v.number()),

    deliveryAddr: v.string(),
    deliveryHour: v.number(),
    deliveryDate: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_phone", ["phoneCC", "phoneNum"])
    .index("by_status", ["status"])
    .index("by_bike_dates", ["bikeId", "startDate"]),

  reviews: defineTable({
    googleId: v.string(),
    name: v.string(),
    rating: v.number(),
    text: v.string(),
    when: v.string(),
    profilePic: v.optional(v.string()),
    fetchedAt: v.number(),
  })
    .index("by_rating", ["rating"])
    .index("by_googleId", ["googleId"]),
});
