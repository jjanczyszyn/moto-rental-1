import { describe, it, expect } from "vitest";
import { countryNameToCC } from "./countries";

describe("countryNameToCC", () => {
  it("maps common OCR-produced names to phone codes", () => {
    expect(countryNameToCC("United States")).toBe("+1");
    expect(countryNameToCC("USA")).toBe("+1");
    expect(countryNameToCC("Canada")).toBe("+1");
    expect(countryNameToCC("United Kingdom")).toBe("+44");
    expect(countryNameToCC("UK")).toBe("+44");
    expect(countryNameToCC("Nicaragua")).toBe("+505");
    expect(countryNameToCC("France")).toBe("+33");
    expect(countryNameToCC("Brazil")).toBe("+55");
  });

  it("is case- and whitespace-insensitive", () => {
    expect(countryNameToCC("  united states  ")).toBe("+1");
    expect(countryNameToCC("FRANCE")).toBe("+33");
  });

  it("returns null for unknown / empty input", () => {
    expect(countryNameToCC("Atlantis")).toBeNull();
    expect(countryNameToCC("")).toBeNull();
    expect(countryNameToCC(null)).toBeNull();
    expect(countryNameToCC(undefined)).toBeNull();
  });
});
