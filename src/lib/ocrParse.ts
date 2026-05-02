// Parses raw OCR text from a driver's license or passport into the fields the
// reservation flow needs. Two paths:
//
//   1. Passport — try the MRZ (Machine Readable Zone) at the bottom first.
//      It's standardised (ICAO 9303 TD3, two lines of 44 chars) and what
//      Tesseract is best at, so when it's present everything is reliable.
//   2. Driver's license — heuristic scan over all text, looking for labels
//      like "EXP", "LN", "FN" and pattern matches.
//
// We keep both deterministic and unit-testable; the OCR screen feeds the
// raw Tesseract text in.

export interface ParsedDocument {
  firstName: string;
  lastName: string;
  docNumber: string;
  expiryISO: string;
  country: string;
  source: "mrz" | "license" | "partial" | "none";
}

// 3-letter ISO country codes (used on passport MRZs and elsewhere) → display
// name we want stored. Aligned with src/lib/countries.ts COUNTRIES.
const ISO3_TO_NAME: Record<string, string> = {
  USA: "United States",
  CAN: "Canada",
  MEX: "Mexico",
  NIC: "Nicaragua",
  CRI: "Costa Rica",
  PAN: "Panama",
  GTM: "Guatemala",
  SLV: "El Salvador",
  HND: "Honduras",
  GBR: "United Kingdom",
  IRL: "Ireland",
  FRA: "France",
  ESP: "Spain",
  DEU: "Germany",
  NLD: "Netherlands",
  BEL: "Belgium",
  ITA: "Italy",
  CHE: "Switzerland",
  AUT: "Austria",
  PRT: "Portugal",
  DNK: "Denmark",
  SWE: "Sweden",
  NOR: "Norway",
  FIN: "Finland",
  POL: "Poland",
  GRC: "Greece",
  BRA: "Brazil",
  ARG: "Argentina",
  CHL: "Chile",
  COL: "Colombia",
  PER: "Peru",
  URY: "Uruguay",
  AUS: "Australia",
  NZL: "New Zealand",
  CHN: "China",
  JPN: "Japan",
  KOR: "South Korea",
  IND: "India",
  IDN: "Indonesia",
  SGP: "Singapore",
  THA: "Thailand",
  VNM: "Vietnam",
  PHL: "Philippines",
  ZAF: "South Africa",
  ARE: "UAE",
  SAU: "Saudi Arabia",
};

// Long-form country names that may appear in the visual zone.
const LONG_NAMES_TO_NAME: Array<[RegExp, string]> = [
  [/united\s*states\s*of\s*america|united\s*states|^usa\b|^u\.s\.a\.\b|^us\b/i, "United States"],
  [/united\s*kingdom|great\s*britain/i, "United Kingdom"],
  [/canada/i, "Canada"],
  [/mexico/i, "Mexico"],
  [/nicaragua/i, "Nicaragua"],
  [/costa\s*rica/i, "Costa Rica"],
  [/france/i, "France"],
  [/spain/i, "Spain"],
  [/germany|deutschland/i, "Germany"],
  [/italy|italia/i, "Italy"],
  [/netherlands|nederland/i, "Netherlands"],
  [/belgium/i, "Belgium"],
  [/portugal/i, "Portugal"],
  [/australia/i, "Australia"],
  [/brazil|brasil/i, "Brazil"],
];

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((part) =>
      /^\s+$|^-$/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join("");
}

// Convert a 2-digit MRZ year + MMDD to ISO. Years 00-29 → 2000s, 30-99 → 1900s
// (ICAO 9303 sliding window). For expiry we hard-code "always 2000s" because a
// 1990s passport is by definition expired.
function mrzExpiryToISO(yymmdd: string): string {
  if (!/^\d{6}$/.test(yymmdd)) return "";
  const yy = parseInt(yymmdd.slice(0, 2), 10);
  const mm = parseInt(yymmdd.slice(2, 4), 10);
  const dd = parseInt(yymmdd.slice(4, 6), 10);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return "";
  const yyyy = 2000 + yy;
  return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

// Pull the two MRZ lines out of arbitrary OCR text. Tesseract sometimes:
// - reads `<` as `K`, `«`, `&` — we accept any of those as filler
// - drops a few characters of length, so we tolerate 40-46 chars per line
// - splits the MRZ across multiple lines with junk around
//
// Returns [line1, line2] when found, both normalised so filler chars become
// `<` and length is exactly 44 (padded or truncated).
function findMrzPair(text: string): [string, string] | null {
  const FILLER = /[<«K@&]/g; // common Tesseract misreads of `<`
  const normalised = text
    .split(/\r?\n/)
    .map((line) =>
      line
        .toUpperCase()
        .replace(/[^A-Z0-9<«K@&]/g, "")
        .replace(FILLER, "<")
    )
    .filter((line) => line.length >= 30);

  // Line 1 must start with "P<" or "P" + country letter, then mostly letters
  // and `<`. Line 2 is mostly digits + a few letters (country, sex).
  for (let i = 0; i < normalised.length - 1; i++) {
    const a = normalised[i];
    const b = normalised[i + 1];
    if (!/^P[A-Z<]/.test(a)) continue;
    // line 2 sanity: at least 6 digits in a row somewhere in first 20 chars
    if (!/\d{6,}/.test(b.slice(0, 30))) continue;
    return [pad44(a), pad44(b)];
  }
  return null;
}

function pad44(s: string): string {
  if (s.length >= 44) return s.slice(0, 44);
  return s + "<".repeat(44 - s.length);
}

function parseMrz(text: string): ParsedDocument | null {
  const pair = findMrzPair(text);
  if (!pair) return null;
  const [line1, line2] = pair;

  // Country at chars 2-4 of line 1.
  const country3 = line1.slice(2, 5);
  const country = ISO3_TO_NAME[country3] ?? "";

  // Names at chars 5..end of line 1: SURNAME<<GIVEN<NAMES<<<<...
  const names = line1.slice(5).replace(/<+$/, "");
  const sepIdx = names.indexOf("<<");
  let lastName = "";
  let firstName = "";
  if (sepIdx > 0) {
    lastName = names.slice(0, sepIdx).replace(/</g, " ").trim();
    firstName = names.slice(sepIdx + 2).replace(/</g, " ").trim();
  } else {
    lastName = names.replace(/</g, " ").trim();
  }

  // Passport number at chars 0-8 of line 2; trim trailing fillers.
  const docNumber = line2.slice(0, 9).replace(/</g, "").trim();

  // Expiry at chars 21-26 of line 2 (YYMMDD).
  const expiryISO = mrzExpiryToISO(line2.slice(21, 27));

  if (!docNumber && !expiryISO && !lastName) return null;

  return {
    firstName: firstName ? titleCase(firstName.split(/\s+/)[0]) : "",
    lastName: lastName ? titleCase(lastName) : "",
    docNumber,
    expiryISO,
    country,
    source: "mrz",
  };
}

function detectCountry(text: string): string {
  for (const [pat, name] of LONG_NAMES_TO_NAME) {
    if (pat.test(text)) return name;
  }
  // Look for stray ISO3 codes like "USA"/"FRA" as standalone tokens.
  const m = text.match(/\b([A-Z]{3})\b/g);
  if (m) {
    for (const code of m) {
      if (ISO3_TO_NAME[code]) return ISO3_TO_NAME[code];
    }
  }
  return "";
}

function parseExpiry(text: string): string {
  // ISO YYYY-MM-DD
  const iso = text.match(/(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (iso) {
    const [, y, m, d] = iso;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Look for an EXP/EXPIRES label first so we don't grab DOB by accident.
  const labelled = text.match(
    /(?:EXP(?:IRES|IRY|IRATION)?|DATE\s+OF\s+EXPIRATION)[\s:./-]*(\d{1,2})[\s./-](\d{1,2}|[A-Z]{3})[\s./-](\d{2,4})/i
  );
  if (labelled) {
    const isoLike = monthDayYear(labelled[1], labelled[2], labelled[3]);
    if (isoLike) return isoLike;
  }

  // Fallback: any DD/MM/YYYY or MM/DD/YYYY (assume MM/DD/YYYY for US docs).
  const dmy = text.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](20\d{2})\b/);
  if (dmy) {
    const isoLike = monthDayYear(dmy[1], dmy[2], dmy[3]);
    if (isoLike) return isoLike;
  }

  // "14 JUN 2030"-style.
  const verbose = text.match(/\b(\d{1,2})\s+([A-Z]{3})\s+(\d{4})\b/i);
  if (verbose) {
    const isoLike = monthDayYear(verbose[1], verbose[2], verbose[3]);
    if (isoLike) return isoLike;
  }

  return "";
}

const MONTHS: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
};

// Best-effort: assumes US-style MM/DD/YYYY when both first two are numeric and
// ambiguous. Accepts "JUN" in the month slot. Validates the calendar date.
function monthDayYear(a: string, b: string, c: string): string {
  let yyyy = parseInt(c, 10);
  if (yyyy < 100) yyyy = 2000 + yyyy;
  let mm: number;
  let dd: number;
  if (/^[A-Z]{3}$/i.test(a)) {
    mm = MONTHS[a.toUpperCase()] ?? 0;
    dd = parseInt(b, 10);
  } else if (/^[A-Z]{3}$/i.test(b)) {
    mm = MONTHS[b.toUpperCase()] ?? 0;
    dd = parseInt(a, 10);
  } else {
    // Numeric/numeric — assume US MM/DD; flip if month would be > 12.
    mm = parseInt(a, 10);
    dd = parseInt(b, 10);
    if (mm > 12 && dd <= 12) [mm, dd] = [dd, mm];
  }
  if (!mm || !dd || mm > 12 || dd > 31) return "";
  const date = new Date(yyyy, mm - 1, dd);
  if (date.getFullYear() !== yyyy || date.getMonth() !== mm - 1 || date.getDate() !== dd) return "";
  return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

function parseLicense(text: string): ParsedDocument {
  const upper = text.toUpperCase();
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Document number: prefer something on a "DL" / "LICENSE NO" line.
  let docNumber = "";
  for (const l of lines) {
    const m = l.match(/(?:DL|LIC(?:ENSE)?\s*(?:NO|#|NUMBER)?|D\.L\.)[\s:.#]*([A-Z0-9-]{6,})/i);
    if (m) { docNumber = m[1].toUpperCase(); break; }
  }
  if (!docNumber) {
    // Fall back: longest token that mixes letters and digits (a DL number
    // never looks like a plain English word).
    const tokens = upper.match(/[A-Z0-9-]{6,}/g) ?? [];
    docNumber =
      tokens
        .filter((t) => /\d/.test(t))
        .filter((t) => !/^(USA|EXP|DOB|ISS|SEX|HGT|WGT|EYES|HAIR|MALE|FEMALE)$/.test(t))
        .sort((a, b) => b.length - a.length)[0] ?? "";
  }

  // Names — look for "LN" (last name) and "FN" (first name) labels (US DLs),
  // or generic NAME / SURNAME labels.
  let firstName = "";
  let lastName = "";
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const lnInline = l.match(/^(?:LN|LAST\s*NAME|SURNAME|APELLIDOS?)[\s:]*([A-Za-z'\- ]+)/i);
    const fnInline = l.match(/^(?:FN|FIRST\s*NAME|GIVEN\s*NAMES?|NOMBRES?)[\s:]*([A-Za-z'\- ]+)/i);
    if (lnInline) lastName = lnInline[1].trim();
    if (fnInline) firstName = fnInline[1].trim().split(/\s+/)[0];

    // Or labels followed by the name on the next line.
    if (/^(LN|LAST\s*NAME|SURNAME)\s*$/i.test(l) && lines[i + 1]) {
      lastName = lines[i + 1].replace(/[^A-Za-z'\- ]/g, "").trim();
    }
    if (/^(FN|FIRST\s*NAME|GIVEN\s*NAMES?)\s*$/i.test(l) && lines[i + 1]) {
      firstName = lines[i + 1].replace(/[^A-Za-z'\- ]/g, "").trim().split(/\s+/)[0];
    }
  }

  // Last fallback: a line of two or more uppercase words.
  if (!firstName || !lastName) {
    const candidate = lines.find((l) => /^[A-Z][A-Z'\-]+\s+[A-Z][A-Z'\-]+/.test(l));
    if (candidate) {
      const parts = candidate.split(/\s+/);
      if (!firstName) firstName = parts[0];
      if (!lastName) lastName = parts.slice(1).join(" ");
    }
  }

  return {
    firstName: firstName ? titleCase(firstName) : "",
    lastName: lastName ? titleCase(lastName) : "",
    docNumber,
    expiryISO: parseExpiry(text),
    country: detectCountry(text),
    source: "license",
  };
}

export function parseDocumentText(text: string): ParsedDocument {
  if (!text || !text.trim()) {
    return { firstName: "", lastName: "", docNumber: "", expiryISO: "", country: "", source: "none" };
  }
  const mrz = parseMrz(text);
  if (mrz) return mrz;
  const lic = parseLicense(text);
  if (lic.firstName || lic.docNumber || lic.expiryISO) {
    return lic;
  }
  return { ...lic, source: "partial" };
}
