// Use the min build — same API, ~40kb gz instead of ~140kb. Plenty for the
// traveler countries we care about (US, CA, EU, LatAm).
import { parsePhoneNumberFromString } from "libphonenumber-js/min";

export interface PhoneCheck {
  /** True only if libphonenumber considers the parsed number valid for its country. */
  isValid: boolean;
  /** Number normalised to E.164 (e.g. "+14155550102") when parseable, else null. */
  e164: string | null;
  /** International display format (e.g. "+1 415 555 0102"). */
  formatted: string | null;
}

// Validates a phone number split into a country code (e.g. "+1", "+505") and a
// local-digits string. Wraps libphonenumber-js so the screen doesn't import
// the whole library directly.
export function checkPhone(cc: string, num: string): PhoneCheck {
  const digits = (num || "").replace(/\D/g, "");
  if (!digits) return { isValid: false, e164: null, formatted: null };
  const candidate = `${cc.startsWith("+") ? cc : `+${cc}`}${digits}`;
  try {
    const parsed = parsePhoneNumberFromString(candidate);
    if (!parsed) return { isValid: false, e164: null, formatted: null };
    return {
      isValid: parsed.isValid(),
      e164: parsed.format("E.164"),
      formatted: parsed.formatInternational(),
    };
  } catch {
    return { isValid: false, e164: null, formatted: null };
  }
}
