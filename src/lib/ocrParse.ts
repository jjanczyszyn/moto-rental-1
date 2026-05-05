// Parses raw OCR text from a passport, ID card, or driver's license into the
// reservation flow's fields. Three paths, in order of preference:
//
//   1. TD3 MRZ (passports): two 44-char lines starting with "P<".
//   2. TD1 MRZ (ID cards): three 30-char lines, first starts with "I"/"ID".
//      Used by German Personalausweis, Spanish DNI, etc.
//   3. Visual-zone heuristics (driver's licenses + ID cards without a
//      readable MRZ). Reads English/Spanish/German/French labels.
//
// Tesseract regularly garbles "<" → "K"/"&"/"@", drops a few characters, and
// reorders lines. We tolerate all of that.

export interface ParsedDocument {
  firstName: string;
  lastName: string;
  docNumber: string;
  expiryISO: string;
  country: string;
  source: "mrz-td3" | "mrz-td1" | "license" | "partial" | "none";
}

// ---------------------------------------------------------------------------
// Country code maps
// ---------------------------------------------------------------------------

// Standard 3-letter ISO codes used in passport and TD1 MRZs.
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
  // Germany sometimes encodes itself as a single "D" left-padded with "<".
  // We handle "D<<" specially in the MRZ parsers but include "D" here as a
  // safe fallback.
  D:   "Germany",
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

// Long-form names that may appear in the visual zone, in priority order.
const LONG_NAMES_TO_NAME: Array<[RegExp, string]> = [
  [/united\s*states\s*of\s*america|united\s*states|\bUSA\b|\bU\.S\.A\.\b/i, "United States"],
  [/united\s*kingdom|great\s*britain/i, "United Kingdom"],
  [/canad(?:a|ienne|ian)/i, "Canada"],
  [/mexico/i, "Mexico"],
  [/nicaragua/i, "Nicaragua"],
  [/costa\s*rica/i, "Costa Rica"],
  [/france|francais/i, "France"],
  // "Reino de España" / "ESPAÑA" / "ESPAÑOLA" — handle missing tilde from OCR.
  [/(reino\s+de\s+)?espan[aoñ]|espa(ñ|n)ola|\bESP\b/i, "Spain"],
  [/bundesrepublik\s+deutschland|deutschland|germany|reisepass|personalausweis/i, "Germany"],
  [/italy|italia/i, "Italy"],
  [/netherlands|nederland/i, "Netherlands"],
  [/belgium/i, "Belgium"],
  [/portugal/i, "Portugal"],
  [/australia/i, "Australia"],
  [/brazil|brasil/i, "Brazil"],
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((part) =>
      /^\s+$|^-$/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join("");
}

// MRZ uses YYMMDD with a sliding century window. For expiry we always assume
// 2000s — anyone with a passport expiring last century is well past renewal.
function mrzExpiryToISO(yymmdd: string): string {
  if (!/^\d{6}$/.test(yymmdd)) return "";
  const yy = parseInt(yymmdd.slice(0, 2), 10);
  const mm = parseInt(yymmdd.slice(2, 4), 10);
  const dd = parseInt(yymmdd.slice(4, 6), 10);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return "";
  const yyyy = 2000 + yy;
  // Validate calendar (rejects 31 Feb etc).
  const date = new Date(yyyy, mm - 1, dd);
  if (date.getFullYear() !== yyyy || date.getMonth() !== mm - 1 || date.getDate() !== dd) {
    return "";
  }
  return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

// Tesseract sometimes produces "<" as one of these. We don't include `K`
// because it's also a valid letter — names like LUKAS / ANNIKA were getting
// shredded. The remaining substitutions are safe (no language uses « / @ / &
// inside a name).
function normaliseMrzLine(s: string): string {
  return s
    .toUpperCase()
    .replace(/[^A-Z0-9<«@&]/g, "")
    .replace(/[«@&]/g, "<");
}

function pad(s: string, n: number): string {
  if (s.length >= n) return s.slice(0, n);
  return s + "<".repeat(n - s.length);
}

// Resolve a country code that came out of the MRZ. Strips leading "<"
// fillers (some German passports encode country as "D<<").
function resolveCountry(code: string): string {
  const stripped = code.replace(/<+/g, "");
  return ISO3_TO_NAME[stripped] ?? "";
}

// ---------------------------------------------------------------------------
// TD3 (passport) parser — 2 lines × 44 chars
//
// Real-world tesseract output is messy. Common failures we tolerate:
//   - "P<" prefix on line 1 read as "PS" (S in place of <), breaking strict
//     length/position math
//   - Leading digit of line 2 dropped, shifting all field positions left
//   - "<<" filler between country and surname (Germany's "D<<" code) confused
//     with the surname/given-names "<<" separator
//
// Strategy: scan first chars for a known country code instead of trusting
// the "P<" prefix; anchor line-2 fields on the country-code substring rather
// than fixed offsets.
// ---------------------------------------------------------------------------

// Look for a country code in the first `maxStart` characters of a normalised
// MRZ line. Returns where the 3-char country slot begins. Handles standard
// 3-letter codes and Germany's single-letter "D<<" form.
function findCountryInHead(
  line: string,
  maxStart: number = 6
): { code: string; pos: number } | null {
  for (let i = 0; i <= Math.min(maxStart, line.length - 3); i++) {
    const slot = line.slice(i, i + 3);
    if (slot.length < 3) break;
    if (ISO3_TO_NAME[slot]) return { code: slot, pos: i };
    if (slot === "D<<") return { code: "D", pos: i };
  }
  return null;
}

// Same idea for line 2 — country is at standard position 10 but OCR can
// shift it left by 1-2 positions, so we scan 5..13. Wider than that risks
// matching TD1 line 2's nationality field (position 15) and confusing an
// ID card for a passport.
function findCountryInLine2(line: string): { code: string; pos: number } | null {
  for (let i = 5; i <= Math.min(13, line.length - 3); i++) {
    const slot = line.slice(i, i + 3);
    if (ISO3_TO_NAME[slot] && slot.length === 3) return { code: slot, pos: i };
  }
  return null;
}

function findTD3Pair(text: string): [string, string] | null {
  const lines = text
    .split(/\r?\n/)
    .map(normaliseMrzLine)
    .filter((l) => l.length >= 20);

  for (let i = 0; i < lines.length - 1; i++) {
    const a = lines[i];
    let b = lines[i + 1];
    // Line 1 must carry a country code in the prefix and a "<<" separator
    // somewhere AFTER the country slot (not inside Germany's "D<<" filler).
    const country = findCountryInHead(a, 6);
    if (!country) continue;
    const afterCountry = country.pos + 3;
    if (a.slice(afterCountry).indexOf("<<") < 0) continue;
    // Line 2 must contain a country code in the TD3 nationality window
    // (positions 5..13). This rejects TD1 line 2 (which has nationality at
    // position 15) and visual-zone numerics that happen to follow a name.
    let l2Country = findCountryInLine2(b);
    // Sometimes OCR splits line 2 across two output lines — try stitching.
    if (!l2Country && i + 2 < lines.length) {
      const stitched = b + lines[i + 2];
      if (findCountryInLine2(stitched)) {
        b = stitched;
        l2Country = findCountryInLine2(b);
      }
    }
    if (!l2Country) continue;
    return [pad(a, 44), pad(b, 44)];
  }
  return null;
}

function parseTD3(text: string): ParsedDocument | null {
  const pair = findTD3Pair(text);
  if (!pair) return null;
  const [line1, line2] = pair;

  const detected = findCountryInHead(line1, 6);
  if (!detected) return null;
  let country = ISO3_TO_NAME[detected.code] ?? "";

  // Surname starts after the 3-char country slot. Searching for "<<" from
  // there sidesteps Germany's "D<<" filler.
  const surnameStart = detected.pos + 3;
  const sepRel = line1.slice(surnameStart).indexOf("<<");
  let lastName = "";
  let firstName = "";
  if (sepRel >= 0) {
    const sepIdx = surnameStart + sepRel;
    lastName = line1.slice(surnameStart, sepIdx).replace(/</g, " ").trim();
    firstName = line1.slice(sepIdx + 2).replace(/</g, " ").trim();
  }

  // Line 2 — anchor on the country code so OCR shifts (dropped leading
  // digits etc.) don't break field offsets.
  let docNumber = "";
  let expiryISO = "";
  const c2 = findCountryInLine2(line2);
  if (c2) {
    if (!country) country = ISO3_TO_NAME[c2.code] ?? "";
    const offset = c2.pos - 10;
    const docStart = Math.max(0, offset);
    const docEnd = Math.max(0, offset + 9);
    docNumber = line2.slice(docStart, docEnd).replace(/</g, "").trim();
    expiryISO = mrzExpiryToISO(line2.slice(offset + 21, offset + 27));
  } else {
    docNumber = line2.slice(0, 9).replace(/</g, "").trim();
    expiryISO = mrzExpiryToISO(line2.slice(21, 27));
  }

  if (!docNumber && !expiryISO && !lastName) return null;

  // Customer-facing first name = first given-name token. Multi-given-name
  // documents (US passports often have two, Spanish ones often have a
  // composite "Maria Carmen") would otherwise show up as the full string.
  const firstNameOne = firstName ? firstName.split(/\s+/)[0] : "";

  return {
    firstName: firstNameOne ? titleCase(firstNameOne) : "",
    lastName: lastName ? titleCase(lastName) : "",
    docNumber,
    expiryISO,
    country,
    source: "mrz-td3",
  };
}

// ---------------------------------------------------------------------------
// TD1 (ID card) parser — 3 lines × 30 chars
//   line 1: type(2)+country(3)+docNumber(9)+check(1)+optional(15)
//   line 2: DOB(6)+check(1)+sex(1)+expiry(6)+check(1)+nationality(3)+optional(11)+composite(1)
//   line 3: SURNAME<<GIVEN<NAMES<<<...  (30)
// ---------------------------------------------------------------------------

function findTD1Triple(text: string): [string, string, string] | null {
  const lines = text
    .split(/\r?\n/)
    .map(normaliseMrzLine)
    .filter((l) => l.length >= 24);

  // We need three consecutive plausible TD1 lines. Heuristics:
  //   line 1: starts with I, A, or C; mostly letters/digits/<
  //   line 2: starts with 6 digits (DOB)
  //   line 3: contains "<<" and is mostly letters
  for (let i = 0; i < lines.length - 2; i++) {
    const a = lines[i];
    const b = lines[i + 1];
    const c = lines[i + 2];
    if (!/^[IAC][A-Z<]/.test(a)) continue;
    if (!/^\d{6}/.test(b)) continue;
    if (!c.includes("<<")) continue;
    return [pad(a, 30), pad(b, 30), pad(c, 30)];
  }
  return null;
}

// Cross-reference the visual zone for a passport number when the MRZ-derived
// number looks short. Real passports have 9 digits/alphanumerics; the MRZ
// slot carries 9 chars + 1 check digit but tesseract sometimes drops the
// leading char.
function findVisualPassportNumber(text: string): string {
  // Country code adjacent to a 8-9 digit run, e.g. printed as "USA NNNNNNNNN".
  const m = text.match(/\b(USA|CAN|DEU|ESP|GBR|FRA|MEX|AUS|NLD|ITA)[\s.:,]+(\d{8,9})\b/i);
  if (m) return m[2];
  // Labelled visual zones: "Passport No.: …" / "N° du Passeport: …" /
  // "Pasaporte n.: …" / "Reisepass-Nr.: …".
  const m2 = text.match(/(?:Passport\s*No\.?|N°?\s*du\s*Passeport|Pasaporte\s*n\.?|Reisepass-?Nr\.?)[\s:.]*([A-Z0-9]{6,9})/i);
  if (m2) return m2[1].toUpperCase();
  return "";
}

function parseTD1(text: string): ParsedDocument | null {
  const triple = findTD1Triple(text);
  if (!triple) return null;
  const [line1, line2, line3] = triple;

  // Country at chars 2..5 (might be "D<<" for older German cards).
  const country = resolveCountry(line1.slice(2, 5));

  // Document number at chars 5..14. Tesseract sometimes pads with "<".
  const docNumber = line1.slice(5, 14).replace(/</g, "").trim();

  // Expiry at chars 8..14 of line 2 (YYMMDD).
  const expiryISO = mrzExpiryToISO(line2.slice(8, 14));

  // Names on line 3.
  const names = line3.replace(/<+$/, "");
  const sepIdx = names.indexOf("<<");
  let lastName = "";
  let firstName = "";
  if (sepIdx > 0) {
    lastName = names.slice(0, sepIdx).replace(/</g, " ").trim();
    firstName = names.slice(sepIdx + 2).replace(/</g, " ").trim();
  } else {
    lastName = names.replace(/</g, " ").trim();
  }

  if (!docNumber && !expiryISO && !lastName) return null;

  const firstNameOne = firstName ? firstName.split(/\s+/)[0] : "";

  return {
    firstName: firstNameOne ? titleCase(firstNameOne) : "",
    lastName: lastName ? titleCase(lastName) : "",
    docNumber,
    expiryISO,
    country,
    source: "mrz-td1",
  };
}

// ---------------------------------------------------------------------------
// Visual-zone heuristics (no readable MRZ)
// ---------------------------------------------------------------------------

function detectCountry(text: string): string {
  for (const [pat, name] of LONG_NAMES_TO_NAME) {
    if (pat.test(text)) return name;
  }
  // Fallback: any standalone ISO3 code that we recognise.
  const tokens = text.match(/\b[A-Z]{3}\b/g);
  if (tokens) {
    for (const t of tokens) {
      if (ISO3_TO_NAME[t]) return ISO3_TO_NAME[t];
    }
  }
  return "";
}

const MONTHS: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
  // German month abbreviations (common on Personalausweis/Reisepass).
  MAI: 5, OKT: 10, DEZ: 12,
  // Spanish abbreviations (less common on documents but seen).
  ENE: 1, ABR: 4, AGO: 8,
  // Canadian-French.
  FEV: 2, AVR: 4,
};

// Build an ISO date from three numeric/textual parts. Validates the calendar.
function buildISODate(yyyy: number, mm: number, dd: number): string {
  if (!yyyy || !mm || !dd || mm > 12 || dd > 31) return "";
  const date = new Date(yyyy, mm - 1, dd);
  if (date.getFullYear() !== yyyy || date.getMonth() !== mm - 1 || date.getDate() !== dd) {
    return "";
  }
  return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

// Best-effort: assumes US-style MM/DD/YYYY when both first two are numeric and
// the value is unambiguous. Accepts "JUN" / "MAI" in the month slot. For pure
// numeric DD MM YYYY we also try a swap if MM > 12 → DD/MM.
function partsToISO(a: string, b: string, c: string, prefer: "mdy" | "dmy" = "mdy"): string {
  let yyyy = parseInt(c, 10);
  if (yyyy < 100) yyyy = 2000 + yyyy;
  if (/^[A-Z]{3}$/i.test(a)) {
    const mm = MONTHS[a.toUpperCase()] ?? 0;
    return buildISODate(yyyy, mm, parseInt(b, 10));
  }
  if (/^[A-Z]{3}$/i.test(b)) {
    const mm = MONTHS[b.toUpperCase()] ?? 0;
    return buildISODate(yyyy, mm, parseInt(a, 10));
  }
  let mm = parseInt(prefer === "mdy" ? a : b, 10);
  let dd = parseInt(prefer === "mdy" ? b : a, 10);
  if (mm > 12 && dd <= 12) [mm, dd] = [dd, mm];
  return buildISODate(yyyy, mm, dd);
}

// Pull an expiry out of free-form text. Knows about expiry labels in EN, ES,
// DE, FR. Date-format preference (US MDY vs ROW DMY) follows the country we
// can detect; defaults to US-friendly MDY for ambiguous numeric pairs because
// the US is the only one of our four target countries that uses that order.
function parseExpiry(text: string, prefer: "mdy" | "dmy"): string {
  // Look near an expiry label first so we don't grab DOB or issue date.
  const labels =
    /(?:EXP(?:IRES|IRY|IRATION)?|DATE\s+OF\s+EXPI(?:RY|RATION)|DATE\s+D'?EXPIRATION|FECHA\s+DE\s+CADUCIDAD|G[UÜ]LTIG\s+BIS|VALABLE\s+JUSQU)/i;
  const labelMatch = text.match(labels);
  if (labelMatch && labelMatch.index != null) {
    const window = text.slice(labelMatch.index, labelMatch.index + 80);
    // YYYY-first formats (Canada / ISO) take priority — otherwise a regex
    // hunting for "DD/MM" can lock onto the inner three groups of
    // "2030/07/21" and produce 2021-07-30.
    const yMd = window.match(/(20\d{2})[.\/\-\s]+(\d{1,2})[.\/\-\s]+(\d{1,2})/);
    if (yMd) {
      const iso = buildISODate(parseInt(yMd[1], 10), parseInt(yMd[2], 10), parseInt(yMd[3], 10));
      if (iso) return iso;
    }
    const dot = window.match(/(\d{1,2})[.\/\-\s]+(\d{1,2}|[A-Z]{3})[.\/\-\s]+(\d{2,4})/i);
    if (dot) {
      const iso = partsToISO(dot[1], dot[2], dot[3], prefer);
      if (iso) return iso;
    }
  }

  // ISO-style YYYY-MM-DD anywhere.
  const iso = text.match(/(20\d{2})[-./](\d{1,2})[-./](\d{1,2})/);
  if (iso) {
    const built = buildISODate(parseInt(iso[1], 10), parseInt(iso[2], 10), parseInt(iso[3], 10));
    if (built) return built;
  }

  // "14 JUN 2030" or "14 MAI 2030" etc.
  const verbose = text.match(/\b(\d{1,2})\s+([A-Z]{3})\s+(\d{4})\b/i);
  if (verbose) {
    const built = partsToISO(verbose[1], verbose[2], verbose[3], prefer);
    if (built) return built;
  }

  // Generic numeric fallback — pick the LAST numeric date in the text, which
  // tends to be the expiry on visual zones (DOB → issue → expiry order).
  const all = [...text.matchAll(/\b(\d{1,2})[\/.\- ](\d{1,2}|[A-Z]{3})[\/.\- ](20\d{2})\b/gi)];
  if (all.length > 0) {
    const last = all[all.length - 1];
    const built = partsToISO(last[1], last[2], last[3], prefer);
    if (built) return built;
  }

  return "";
}

// Strip diacritics so "Naumánn"/"Vornámen" still match plain-ASCII labels.
function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Try to read a labelled name field. Looks first for inline labels
// ("LN ALEX ..."), then for a label on its own line followed by the value
// on the next line ("Apellidos\nGUTIERREZ ARENAS").
function readLabelledLine(lines: string[], labelPattern: RegExp): string {
  for (let i = 0; i < lines.length; i++) {
    const stripped = stripDiacritics(lines[i]);
    const m = stripped.match(labelPattern);
    if (!m) continue;
    // Inline value.
    const after = stripped.slice(m[0].length).replace(/^[\s:.\/]+/, "").trim();
    const inline = after.replace(/[^A-Za-z'\- ]/g, "").trim();
    if (inline.length >= 2) return inline;
    // Value on the next non-empty line.
    for (let j = i + 1; j < lines.length; j++) {
      const next = stripDiacritics(lines[j]).replace(/[^A-Za-z'\- ]/g, "").trim();
      if (next.length >= 2) return next;
    }
  }
  return "";
}

interface VisualZoneOptions {
  prefer: "mdy" | "dmy";
}

function parseVisualZone(text: string, opts: VisualZoneOptions): ParsedDocument {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // ---- Document number ------------------------------------------------
  // 1) US/CA driver-license style "DL <number>" / "Permis de conduire"
  // 2) Spanish DNI (8 digits + 1 letter) — distinct enough we always prefer it
  // 3) German Reisepass-Nr. / Dokumentennummer label
  // 4) Generic longest token containing letters AND digits as a fallback
  let docNumber = "";
  // Spanish DNI takes priority because the MRZ would carry the support-number
  // and we want the user-facing one.
  const dni = text.match(/\b(\d{8}[A-Z])\b/);
  if (dni) docNumber = dni[1];
  if (!docNumber) {
    for (const l of lines) {
      const stripped = stripDiacritics(l);
      const labelled = stripped.match(
        /(?:DL|LIC(?:ENSE|ENCE)?\s*(?:NO|NUM|#)?|D\.L\.|DOKUMENTEN-?NUMMER|REISEPASS-?NR|PASSPORT\s*NO|PASAPORTE\s*N[O°]?|N[°O]\s*DE?\s*PASSEPORT|DNI)[\s:.#\/]*([A-Z0-9-]{6,})/i
      );
      if (labelled) {
        docNumber = labelled[1].toUpperCase();
        break;
      }
    }
  }
  if (!docNumber) {
    const upper = text.toUpperCase();
    const tokens = upper.match(/[A-Z0-9-]{6,}/g) ?? [];
    docNumber =
      tokens
        .filter((t) => /\d/.test(t))
        .filter(
          (t) =>
            !/^(USA|CAN|DEU|ESP|EXP|DOB|ISS|SEX|HGT|WGT|EYES|HAIR|MALE|FEMALE)$/.test(t)
        )
        .sort((a, b) => b.length - a.length)[0] ?? "";
  }

  // ---- Names ----------------------------------------------------------
  // Last name labels: LN, LAST NAME, SURNAME, APELLIDOS, FAMILIENNAME, NOM
  // First name labels: FN, FIRST NAME, GIVEN NAMES, NOMBRE, VORNAMEN, PRENOMS
  const lastLabel =
    /^(?:LN|LAST\s*NAME|SURNAME|APELLIDOS?(?:\s*\/\s*\w+)?|FAMILIENNAME(?:\s*\/\s*\w+)?|NOM(?:\s*\/\s*\w+)?|PRIMER\s+APELLIDO)\b/i;
  const firstLabel =
    /^(?:FN|FIRST\s*NAME|GIVEN\s*NAMES?(?:\s*\/\s*\w+)?|NOMBRES?(?:\s*\/\s*\w+)?|VORNAMEN?(?:\s*\/\s*\w+)?|PRENOMS?(?:\s*\/\s*\w+)?)\b/i;

  let lastName = readLabelledLine(lines, lastLabel);
  let firstName = readLabelledLine(lines, firstLabel);

  // Spanish DNI splits "PRIMER APELLIDO" / "SEGUNDO APELLIDO" — append the
  // second surname to the first if present.
  for (let i = 0; i < lines.length; i++) {
    if (/^SEGUNDO\s+APELLIDO/i.test(stripDiacritics(lines[i]))) {
      for (let j = i + 1; j < lines.length; j++) {
        const next = stripDiacritics(lines[j]).replace(/[^A-Za-z'\- ]/g, "").trim();
        if (next.length >= 2) {
          if (lastName) lastName = `${lastName} ${next}`;
          else lastName = next;
          break;
        }
      }
    }
  }

  // Trim multi-given-names down to the first one (Karen needs to know what
  // to call them, not their full birth name).
  if (firstName) firstName = firstName.split(/\s+/)[0];

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
    expiryISO: parseExpiry(text, opts.prefer),
    country: detectCountry(text),
    source: "license",
  };
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function parseDocumentText(text: string): ParsedDocument {
  if (!text || !text.trim()) {
    return {
      firstName: "", lastName: "", docNumber: "", expiryISO: "", country: "",
      source: "none",
    };
  }
  const td3 = parseTD3(text);
  if (td3) {
    // If the MRZ-derived doc number is short (8 digits where most passports
    // carry 9), see if the visual zone has the full number and prefer it.
    if (td3.docNumber && /^\d{7,8}$/.test(td3.docNumber)) {
      const visual = findVisualPassportNumber(text);
      if (visual && visual.length > td3.docNumber.length) td3.docNumber = visual;
    }
    return td3;
  }
  const td1 = parseTD1(text);
  if (td1) {
    // For Spanish DNI: visual zone has the user-facing DNI (8 digits + letter)
    // while the MRZ carries the bureaucratic "support number". Prefer the DNI
    // when we can find one in the text.
    if (td1.country === "Spain") {
      const dni = text.match(/\b(\d{8}[A-Z])\b/);
      if (dni) td1.docNumber = dni[1];
    }
    return td1;
  }
  // Country detection chooses the date-format preference for visual zones.
  const country = detectCountry(text);
  const prefer: "mdy" | "dmy" = country === "United States" ? "mdy" : "dmy";
  const lic = parseVisualZone(text, { prefer });
  if (lic.firstName || lic.docNumber || lic.expiryISO) return lic;
  return { ...lic, source: "partial" };
}
