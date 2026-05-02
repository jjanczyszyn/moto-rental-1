// ISO YYYY-MM-DD <-> display dd-mm-YYYY for the document expiry field.

export function formatExpiryDisplay(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

// Accepts what a user is typing into the dd-mm-YYYY field. Returns:
// - the ISO YYYY-MM-DD string when the input is a complete, valid date
// - the raw input echoed back when it is incomplete (so typing works)
// - empty string when the input is empty
//
// "Complete and valid" means dd-mm-YYYY with day in 1..31, month in 1..12,
// year >= 1900, and the date round-trips through Date (so 31-02-2030 fails).
export function parseExpiryInput(input: string): { iso: string; display: string } {
  const trimmed = (input ?? "").trim();
  if (!trimmed) return { iso: "", display: "" };

  // Accept dd-mm-YYYY, dd/mm/YYYY, dd.mm.YYYY.
  const m = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (!m) return { iso: "", display: trimmed };

  const dd = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const yyyy = parseInt(m[3], 10);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31 || yyyy < 1900) {
    return { iso: "", display: trimmed };
  }
  const d = new Date(yyyy, mm - 1, dd);
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) {
    return { iso: "", display: trimmed };
  }
  const iso = `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  const display = `${String(dd).padStart(2, "0")}-${String(mm).padStart(2, "0")}-${yyyy}`;
  return { iso, display };
}
