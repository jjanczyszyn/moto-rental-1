import { describe, it, expect } from "vitest";
import { computeTotal, daysBetweenISO } from "./pricing";

const RATES = { daily: 20, weekly: 120, monthly: 450 };

describe("computeTotal", () => {
  it("returns 0 for 0 days", () => {
    expect(computeTotal(0, RATES)).toBe(0);
  });

  it("daily rate under a week", () => {
    expect(computeTotal(1, RATES)).toBe(20);
    expect(computeTotal(3, RATES)).toBe(60);
    expect(computeTotal(6, RATES)).toBe(120);
  });

  it("7 days = $120 (one week, not 7×20=140)", () => {
    expect(computeTotal(7, RATES)).toBe(120);
  });

  it("11 days ≈ $189 (week + 4 prorated)", () => {
    expect(computeTotal(11, RATES)).toBe(189);
  });

  it("14 days = $240 (two weeks)", () => {
    expect(computeTotal(14, RATES)).toBe(240);
  });

  it("30 days = $450 (one month, not 4 weeks + 2 days)", () => {
    expect(computeTotal(30, RATES)).toBe(450);
  });

  it("35 days = $525 (month + 5 monthly-prorated)", () => {
    expect(computeTotal(35, RATES)).toBe(525);
  });

  it("60 days = 2 months = $900", () => {
    expect(computeTotal(60, RATES)).toBe(900);
  });
});

describe("daysBetweenISO", () => {
  it("computes the number of days", () => {
    expect(daysBetweenISO("2026-05-01", "2026-05-08")).toBe(7);
    expect(daysBetweenISO("2026-05-01", "2026-05-31")).toBe(30);
  });
});
