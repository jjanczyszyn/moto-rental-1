// Country-name → phone country code lookup. Names cover both the
// COUNTRY_CODES dropdown labels in Phone.tsx and the country names the
// OCR parser produces, so a doc from "United States" defaults the
// Phone screen to "+1" without the user having to set it.

const NAME_TO_CC: Record<string, string> = {
  // North America
  "united states": "+1",
  "usa": "+1",
  "us": "+1",
  "u.s.a.": "+1",
  "united states of america": "+1",
  "canada": "+1",
  "mexico": "+52",
  // Central America
  "nicaragua": "+505",
  "costa rica": "+506",
  "panama": "+507",
  "guatemala": "+502",
  "el salvador": "+503",
  "honduras": "+504",
  // Europe
  "france": "+33",
  "spain": "+34",
  "uk": "+44",
  "united kingdom": "+44",
  "great britain": "+44",
  "germany": "+49",
  "netherlands": "+31",
  "italy": "+39",
  "switzerland": "+41",
  "austria": "+43",
  "belgium": "+32",
  "denmark": "+45",
  "sweden": "+46",
  "norway": "+47",
  "finland": "+358",
  "poland": "+48",
  "portugal": "+351",
  "ireland": "+353",
  "greece": "+30",
  // South America
  "brazil": "+55",
  "argentina": "+54",
  "chile": "+56",
  "colombia": "+57",
  "peru": "+51",
  "uruguay": "+598",
  // Asia / Pacific
  "australia": "+61",
  "new zealand": "+64",
  "china": "+86",
  "japan": "+81",
  "south korea": "+82",
  "india": "+91",
  "indonesia": "+62",
  "singapore": "+65",
  "thailand": "+66",
  "vietnam": "+84",
  "philippines": "+63",
  // Middle East / Africa
  "uae": "+971",
  "saudi arabia": "+966",
  "south africa": "+27",
};

export function countryNameToCC(name: string | null | undefined): string | null {
  if (!name) return null;
  const key = name.trim().toLowerCase();
  if (!key) return null;
  return NAME_TO_CC[key] ?? null;
}
