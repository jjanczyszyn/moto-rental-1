import { describe, it, expect } from "vitest";
import { parseDocumentText } from "./ocrParse";

// Sample OCR text resembling what tesseract.js produces for a US passport
// (visual zone followed by the two-line MRZ at the bottom).
const US_PASSPORT_OCR = `
UNITED STATES OF AMERICA
PASSPORT
Type/Type     Code/Code de pays     Passport No./No du Passeport
P             USA                   123456789
Surname/Nom
SMITH
Given Names/Prénoms
JOHN MICHAEL
Nationality/Nationalité
UNITED STATES OF AMERICA
Date of birth/Date de naissance
01 JAN 1980
Place of birth/Lieu de naissance
NEW YORK, U.S.A.
Sex/Sexe         Date of issue/Date de délivrance
M                15 JUN 2020
Authority/Autorité                  Date of expiration/Date d'expiration
United States Department of State   14 JUN 2030

P<USASMITH<<JOHN<MICHAEL<<<<<<<<<<<<<<<<<<<<
1234567894USA8001011M3006143<<<<<<<<<<<<<<00
`;

// Same passport but with the kind of OCR noise tesseract produces:
// - some `<` read as `K`
// - line 1 truncated by a few chars
// - extra junk text around the MRZ
const US_PASSPORT_OCR_NOISY = `
UNITED STATES OF AMERICA
sa Passport No.
P USA 987654321

Date of expiration: 22 SEP 2032

Pheaopugesssanjasdfasf

P<USAJONES<<EMMA<ROSE<<<<<<<<<<<<<<<<<<KK<<
9876543210USA9203157F3209225<<<<<<<<<<<<<<00
`;

const US_DRIVERS_LICENSE_OCR = `
DRIVER LICENSE
CALIFORNIA USA
DL A1234567
LN MORALES
FN ALEX
DOB 08/14/1995
EXP 08/14/2031
ISS 08/14/2023
SEX M
HGT 5'-10"
EYES BRN
HAIR BRN
1234 MAIN ST
LOS ANGELES, CA 90001
`;

describe("parseDocumentText — US passport (MRZ)", () => {
  const r = parseDocumentText(US_PASSPORT_OCR);

  it("identifies the MRZ as the source", () => {
    expect(r.source).toBe("mrz");
  });
  it("extracts first name", () => {
    expect(r.firstName).toBe("John");
  });
  it("extracts surname", () => {
    expect(r.lastName).toBe("Smith");
  });
  it("extracts passport number", () => {
    expect(r.docNumber).toBe("123456789");
  });
  it("extracts expiry as ISO YYYY-MM-DD", () => {
    expect(r.expiryISO).toBe("2030-06-14");
  });
  it("resolves USA → United States", () => {
    expect(r.country).toBe("United States");
  });
});

describe("parseDocumentText — US passport (noisy MRZ)", () => {
  const r = parseDocumentText(US_PASSPORT_OCR_NOISY);

  it("still finds the MRZ when surrounded by junk", () => {
    expect(r.source).toBe("mrz");
  });
  it("extracts the right passport number", () => {
    expect(r.docNumber).toBe("987654321");
  });
  it("extracts the right expiry", () => {
    expect(r.expiryISO).toBe("2032-09-22");
  });
  it("extracts names", () => {
    expect(r.firstName).toBe("Emma");
    expect(r.lastName).toBe("Jones");
  });
});

describe("parseDocumentText — US driver's license", () => {
  const r = parseDocumentText(US_DRIVERS_LICENSE_OCR);

  it("identifies the license path", () => {
    expect(r.source).toBe("license");
  });
  it("extracts first/last from FN/LN labels", () => {
    expect(r.firstName).toBe("Alex");
    expect(r.lastName).toBe("Morales");
  });
  it("extracts the DL number from the DL label", () => {
    expect(r.docNumber).toBe("A1234567");
  });
  it("extracts expiry from the EXP label", () => {
    expect(r.expiryISO).toBe("2031-08-14");
  });
  it("identifies USA from the state line", () => {
    expect(r.country).toBe("United States");
  });
});

describe("parseDocumentText — degenerate input", () => {
  it("returns empty fields for empty text", () => {
    const r = parseDocumentText("");
    expect(r).toMatchObject({ firstName: "", lastName: "", docNumber: "", expiryISO: "", country: "", source: "none" });
  });
  it("falls back gracefully when nothing matches", () => {
    const r = parseDocumentText("Random unrelated photo of a cat sitting on a mat.");
    expect(r.firstName).toBe("");
    expect(r.docNumber).toBe("");
    expect(r.expiryISO).toBe("");
  });
});
