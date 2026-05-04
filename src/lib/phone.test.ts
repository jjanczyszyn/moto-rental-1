import { describe, it, expect } from "vitest";
import { checkPhone } from "./phone";

describe("checkPhone", () => {
  it("accepts a real US number", () => {
    const r = checkPhone("+1", "415 555 0102");
    expect(r.isValid).toBe(true);
    expect(r.e164).toBe("+14155550102");
  });

  it("accepts a Nicaragua mobile (8 digits, +505)", () => {
    expect(checkPhone("+505", "8975 0052").isValid).toBe(true);
  });

  it("accepts a French mobile", () => {
    expect(checkPhone("+33", "6 12 34 56 78").isValid).toBe(true);
  });

  it("rejects a number that's too short for its country", () => {
    expect(checkPhone("+1", "555").isValid).toBe(false);
    expect(checkPhone("+505", "1234").isValid).toBe(false);
  });

  it("rejects empty input", () => {
    expect(checkPhone("+1", "")).toEqual({ isValid: false, e164: null, formatted: null });
    expect(checkPhone("+505", "   ").isValid).toBe(false);
  });

  it("normalises non-digit punctuation in the local part", () => {
    expect(checkPhone("+1", "(415) 555-0102").e164).toBe("+14155550102");
  });

  it("rejects an obviously invalid number for the chosen country", () => {
    // Far too long for +1.
    expect(checkPhone("+1", "12345678901234567890").isValid).toBe(false);
  });

  it("works whether the cc is passed with or without the plus sign", () => {
    expect(checkPhone("+1", "415 555 0102").isValid).toBe(true);
    expect(checkPhone("1", "415 555 0102").isValid).toBe(true);
  });
});
