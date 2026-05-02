"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";

// Server-side OCR is a stub. The frontend uses tesseract.js in-browser per
// SPEC §5; this action exists so the contract is honoured and we can later
// swap in a vision API server-side.
export const extractFromImage = action({
  args: { storageId: v.id("_storage") },
  handler: async () => {
    return {
      ok: false,
      reason: "client_side_ocr_used",
      firstName: "",
      lastName: "",
      docNumber: "",
      expiryISO: "",
      country: "",
      rawJson: "{}",
    };
  },
});
