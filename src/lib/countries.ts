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

// Canonical full country names used by the document Country dropdown. Keep
// these aligned with NAME_TO_CC so picking a country here gives the Phone
// screen a sensible default code.
export interface Country {
  name: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { name: "Nicaragua", flag: "🇳🇮" },
  { name: "United States", flag: "🇺🇸" },
  { name: "Canada", flag: "🇨🇦" },
  { name: "Mexico", flag: "🇲🇽" },
  { name: "Costa Rica", flag: "🇨🇷" },
  { name: "Panama", flag: "🇵🇦" },
  { name: "Guatemala", flag: "🇬🇹" },
  { name: "El Salvador", flag: "🇸🇻" },
  { name: "Honduras", flag: "🇭🇳" },
  { name: "France", flag: "🇫🇷" },
  { name: "Spain", flag: "🇪🇸" },
  { name: "United Kingdom", flag: "🇬🇧" },
  { name: "Ireland", flag: "🇮🇪" },
  { name: "Germany", flag: "🇩🇪" },
  { name: "Netherlands", flag: "🇳🇱" },
  { name: "Belgium", flag: "🇧🇪" },
  { name: "Italy", flag: "🇮🇹" },
  { name: "Switzerland", flag: "🇨🇭" },
  { name: "Austria", flag: "🇦🇹" },
  { name: "Portugal", flag: "🇵🇹" },
  { name: "Denmark", flag: "🇩🇰" },
  { name: "Sweden", flag: "🇸🇪" },
  { name: "Norway", flag: "🇳🇴" },
  { name: "Finland", flag: "🇫🇮" },
  { name: "Poland", flag: "🇵🇱" },
  { name: "Greece", flag: "🇬🇷" },
  { name: "Brazil", flag: "🇧🇷" },
  { name: "Argentina", flag: "🇦🇷" },
  { name: "Chile", flag: "🇨🇱" },
  { name: "Colombia", flag: "🇨🇴" },
  { name: "Peru", flag: "🇵🇪" },
  { name: "Uruguay", flag: "🇺🇾" },
  { name: "Australia", flag: "🇦🇺" },
  { name: "New Zealand", flag: "🇳🇿" },
  { name: "China", flag: "🇨🇳" },
  { name: "Japan", flag: "🇯🇵" },
  { name: "South Korea", flag: "🇰🇷" },
  { name: "India", flag: "🇮🇳" },
  { name: "Indonesia", flag: "🇮🇩" },
  { name: "Singapore", flag: "🇸🇬" },
  { name: "Thailand", flag: "🇹🇭" },
  { name: "Vietnam", flag: "🇻🇳" },
  { name: "Philippines", flag: "🇵🇭" },
  { name: "South Africa", flag: "🇿🇦" },
  { name: "UAE", flag: "🇦🇪" },
  { name: "Saudi Arabia", flag: "🇸🇦" },
];

export function findCountry(name: string | null | undefined): Country | null {
  if (!name) return null;
  const key = name.trim().toLowerCase();
  if (!key) return null;
  return COUNTRIES.find((c) => c.name.toLowerCase() === key) ?? null;
}
