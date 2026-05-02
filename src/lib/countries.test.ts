import { describe, it, expect } from "vitest";
import { COUNTRIES, countryNameToCC, findCountry } from "./countries";

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

describe("COUNTRIES dropdown list", () => {
  it("every dropdown country resolves to a phone code", () => {
    for (const c of COUNTRIES) {
      expect(countryNameToCC(c.name), `missing CC for ${c.name}`).not.toBeNull();
    }
  });

  it("findCountry is case-insensitive", () => {
    expect(findCountry("united states")?.name).toBe("United States");
    expect(findCountry("FRANCE")?.name).toBe("France");
    expect(findCountry("nicaragua")?.flag).toBe("🇳🇮");
  });

  it("findCountry returns null for unknown / empty", () => {
    expect(findCountry("Atlantis")).toBeNull();
    expect(findCountry("")).toBeNull();
  });
});
