import React from "react";
import { COUNTRIES, findCountry } from "../lib/countries";

// Searchable country picker. Stores the canonical country NAME as the value;
// shows flag + name in the closed state and in the list.
export function CountrySelect({
  value,
  onChange,
  label = "Country",
}: {
  value: string;
  onChange: (name: string) => void;
  label?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const wrapRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // Surface a country even when the OCR's name doesn't exactly match the list
  // (e.g., "USA" → United States happens via countryNameToCC; here we just show
  // the raw value so the user sees something is set).
  const matched = findCountry(value);
  const display = matched ?? (value ? { name: value, flag: "🌐" } : null);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(q))
    : COUNTRIES;

  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 0.6, textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>
        {label}
      </div>
      <div ref={wrapRef} style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => { setOpen((o) => !o); setQuery(""); }}
          style={{
            width: "100%",
            padding: "13px 14px",
            borderRadius: 12,
            border: "1px solid var(--line)",
            background: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            fontSize: 15,
            outline: "none",
          }}
        >
          {display ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18, lineHeight: 1, fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' }}>
                {display.flag}
              </span>
              <span>{display.name}</span>
            </span>
          ) : (
            <span style={{ color: "var(--muted)" }}>Select country</span>
          )}
          <span style={{ color: "var(--muted)", fontSize: 10 }}>▾</span>
        </button>
        {open && (
          <div style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 30,
            background: "#fff",
            border: "1px solid var(--line)",
            borderRadius: 12,
            boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
            overflow: "hidden",
          }}>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country"
              style={{ width: "100%", padding: "12px 12px", border: "none", borderBottom: "1px solid var(--line)", outline: "none", fontSize: 13, fontFamily: "inherit" }}
            />
            <div style={{ maxHeight: 240, overflowY: "auto" }}>
              {filtered.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => { onChange(c.name); setOpen(false); }}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: c.name === value ? "#fafafa" : "#fff",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1, fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' }}>{c.flag}</span>
                  <span style={{ fontSize: 14 }}>{c.name}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <div style={{ padding: 12, fontSize: 12, color: "var(--muted)", textAlign: "center" }}>No match</div>
              )}
            </div>
          </div>
        )}
      </div>
    </label>
  );
}
