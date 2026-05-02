import { describe, it, expect } from "vitest";
import { formatExpiryDisplay, parseExpiryInput } from "./dates";

describe("formatExpiryDisplay", () => {
  it("formats ISO YYYY-MM-DD as dd-mm-YYYY", () => {
    expect(formatExpiryDisplay("2031-08-14")).toBe("14-08-2031");
    expect(formatExpiryDisplay("2026-01-05")).toBe("05-01-2026");
  });

  it("preserves zero-padding", () => {
    expect(formatExpiryDisplay("2030-09-01")).toBe("01-09-2030");
  });

  it("returns '' for empty/nullish", () => {
    expect(formatExpiryDisplay("")).toBe("");
    expect(formatExpiryDisplay(null)).toBe("");
    expect(formatExpiryDisplay(undefined)).toBe("");
  });

  it("echoes non-ISO input unchanged so typed-but-invalid values still render", () => {
    expect(formatExpiryDisplay("not-a-date")).toBe("not-a-date");
  });
});

describe("parseExpiryInput", () => {
  it("parses dd-mm-YYYY into ISO", () => {
    expect(parseExpiryInput("14-08-2031")).toEqual({ iso: "2031-08-14", display: "14-08-2031" });
  });

  it("accepts dd/mm/YYYY and dd.mm.YYYY", () => {
    expect(parseExpiryInput("14/08/2031").iso).toBe("2031-08-14");
    expect(parseExpiryInput("14.08.2031").iso).toBe("2031-08-14");
  });

  it("accepts unpadded day/month and re-pads display", () => {
    expect(parseExpiryInput("3-1-2030")).toEqual({ iso: "2030-01-03", display: "03-01-2030" });
  });

  it("rejects out-of-range months and days", () => {
    expect(parseExpiryInput("14-13-2031").iso).toBe("");
    expect(parseExpiryInput("32-08-2031").iso).toBe("");
  });

  it("rejects invalid calendar dates (e.g. 31 Feb)", () => {
    expect(parseExpiryInput("31-02-2030").iso).toBe("");
  });

  it("returns empty for empty input", () => {
    expect(parseExpiryInput("")).toEqual({ iso: "", display: "" });
  });

  it("echoes incomplete/unrecognised input so the user can keep typing", () => {
    expect(parseExpiryInput("14-08")).toEqual({ iso: "", display: "14-08" });
  });
});
