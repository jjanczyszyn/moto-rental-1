"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";

// Stub for v1: we don't generate a server-side PDF yet. The frontend builds
// the contract view from the reservation row and the user's signature. This
// action exists so the SPEC contract is honoured and we can swap in
// @react-pdf/renderer later.
export const generatePdf = action({
  args: { reservationId: v.id("reservations") },
  handler: async () => {
    return { ok: false, reason: "not_implemented_in_v1" };
  },
});
