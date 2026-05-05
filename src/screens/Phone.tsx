import React from "react";
import { ReservationDraft } from "../hooks/useReservationDraft";
import { StepHeader, ProgressBar, PrimaryButton, Field } from "../components/Common";
import { countryNameToCC } from "../lib/countries";
import { checkPhone } from "../lib/phone";
import { useI18n } from "../i18n/I18nContext";

const COUNTRY_CODES = [
  { code: "+505", name: "Nicaragua", flag: "🇳🇮" },
  { code: "+1",   name: "USA / Canada", flag: "🇺🇸" },
  { code: "+52",  name: "Mexico", flag: "🇲🇽" },
  { code: "+506", name: "Costa Rica", flag: "🇨🇷" },
  { code: "+33",  name: "France", flag: "🇫🇷" },
  { code: "+34",  name: "Spain", flag: "🇪🇸" },
  { code: "+44",  name: "UK", flag: "🇬🇧" },
  { code: "+49",  name: "Germany", flag: "🇩🇪" },
  { code: "+31",  name: "Netherlands", flag: "🇳🇱" },
  { code: "+61",  name: "Australia", flag: "🇦🇺" },
  { code: "+39",  name: "Italy", flag: "🇮🇹" },
  { code: "+41",  name: "Switzerland", flag: "🇨🇭" },
  { code: "+43",  name: "Austria", flag: "🇦🇹" },
  { code: "+32",  name: "Belgium", flag: "🇧🇪" },
  { code: "+45",  name: "Denmark", flag: "🇩🇰" },
  { code: "+46",  name: "Sweden", flag: "🇸🇪" },
  { code: "+47",  name: "Norway", flag: "🇳🇴" },
  { code: "+358", name: "Finland", flag: "🇫🇮" },
  { code: "+48",  name: "Poland", flag: "🇵🇱" },
  { code: "+351", name: "Portugal", flag: "🇵🇹" },
  { code: "+353", name: "Ireland", flag: "🇮🇪" },
  { code: "+30",  name: "Greece", flag: "🇬🇷" },
  { code: "+86",  name: "China", flag: "🇨🇳" },
  { code: "+81",  name: "Japan", flag: "🇯🇵" },
  { code: "+82",  name: "South Korea", flag: "🇰🇷" },
  { code: "+91",  name: "India", flag: "🇮🇳" },
  { code: "+62",  name: "Indonesia", flag: "🇮🇩" },
  { code: "+65",  name: "Singapore", flag: "🇸🇬" },
  { code: "+66",  name: "Thailand", flag: "🇹🇭" },
  { code: "+84",  name: "Vietnam", flag: "🇻🇳" },
  { code: "+63",  name: "Philippines", flag: "🇵🇭" },
  { code: "+64",  name: "New Zealand", flag: "🇳🇿" },
  { code: "+27",  name: "South Africa", flag: "🇿🇦" },
  { code: "+971", name: "UAE", flag: "🇦🇪" },
  { code: "+966", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+55",  name: "Brazil", flag: "🇧🇷" },
  { code: "+54",  name: "Argentina", flag: "🇦🇷" },
  { code: "+56",  name: "Chile", flag: "🇨🇱" },
  { code: "+57",  name: "Colombia", flag: "🇨🇴" },
  { code: "+51",  name: "Peru", flag: "🇵🇪" },
  { code: "+507", name: "Panama", flag: "🇵🇦" },
  { code: "+502", name: "Guatemala", flag: "🇬🇹" },
  { code: "+503", name: "El Salvador", flag: "🇸🇻" },
  { code: "+504", name: "Honduras", flag: "🇭🇳" },
];

export function PhoneScreen({
  state, set, onBack, onNext,
}: {
  state: ReservationDraft;
  set: (p: Partial<ReservationDraft>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const { t } = useI18n();
  const [ccOpen, setCcOpen] = React.useState(false);
  const [ccQuery, setCcQuery] = React.useState("");
  const wrapRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!ccOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setCcOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [ccOpen]);

  // Default the phone country code from the document country once — only
  // until the user has explicitly picked a code from the dropdown.
  React.useEffect(() => {
    if (state.phoneCCManuallySet) return;
    const fromDoc = countryNameToCC(state.docCountry);
    if (fromDoc && fromDoc !== state.phoneCC) set({ phoneCC: fromDoc });
  }, [state.docCountry, state.phoneCCManuallySet, state.phoneCC, set]);

  const currentCC = state.phoneCC || "+505";
  const currentEntry = COUNTRY_CODES.find((c) => c.code === currentCC) || COUNTRY_CODES[0];

  const q = ccQuery.trim().toLowerCase();
  const filtered = q
    ? COUNTRY_CODES.filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          c.code.replace("+", "").includes(q.replace("+", "")) ||
          c.name.toLowerCase().includes(q)
      )
    : COUNTRY_CODES;

  const phone = checkPhone(state.phoneCC || "+505", state.phoneNum || "");
  const hasDigits = (state.phoneNum || "").replace(/\D/g, "").length > 0;
  const showInvalidWarning = hasDigits && !phone.isValid;
  const noteOk = (state.phoneNote || "").trim().length >= 10;
  const ok = phone.isValid || (showInvalidWarning && noteOk);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#fff" }}>
      <StepHeader onBack={onBack} title={t("phone.title")} step={4} total={7} />
      <ProgressBar step={4} total={7} />
      <div style={{ flex: 1, padding: "8px 16px" }}>
        <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.5, margin: "8px 0 18px" }}>
          {t("phone.intro")}
        </p>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <div ref={wrapRef} style={{ position: "relative", flex: "0 0 110px" }}>
            <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 0.6, textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>{t("phone.code")}</div>
            <button type="button" onClick={() => { setCcOpen(o => !o); setCcQuery(""); }} style={{
              width: "100%", padding: "13px 10px", borderRadius: 12, border: "1px solid var(--line)",
              background: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "space-between", gap: 6, fontSize: 15, height: 48,
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "JetBrains Mono, monospace" }}>
                <span style={{ fontSize: 18, lineHeight: 1, fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' }}>{currentEntry.flag}</span>
                <span>{currentEntry.code}</span>
              </span>
              <span style={{ color: "var(--muted)", fontSize: 10 }}>▾</span>
            </button>
            {ccOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, width: "min(240px, calc(100vw - 32px))", zIndex: 30, background: "#fff", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "0 12px 32px rgba(0,0,0,0.12)", overflow: "hidden" }}>
                <input
                  autoFocus
                  value={ccQuery}
                  onChange={(e) => setCcQuery(e.target.value)}
                  placeholder={t("phone.searchPlaceholder")}
                  style={{ width: "100%", padding: "12px 12px", border: "none", borderBottom: "1px solid var(--line)", outline: "none", fontSize: 13, fontFamily: "inherit" }}
                />
                <div style={{ maxHeight: 240, overflowY: "auto" }}>
                  {filtered.map((c) => (
                    <button
                      key={c.code + c.name}
                      type="button"
                      onClick={() => { set({ phoneCC: c.code, phoneCCManuallySet: true }); setCcOpen(false); }}
                      style={{
                        width: "100%", padding: "10px 12px", display: "flex", alignItems: "center", gap: 10,
                        background: c.code === currentCC ? "#fafafa" : "#fff", border: "none", cursor: "pointer", textAlign: "left",
                      }}
                    >
                      <span style={{ fontSize: 18, lineHeight: 1, fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' }}>{c.flag}</span>
                      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, fontWeight: 500 }}>{c.code}</span>
                      <span style={{ fontSize: 12.5, color: "var(--muted)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <div style={{ padding: "12px", fontSize: 12, color: "var(--muted)", textAlign: "center" }}>{t("phone.noMatch")}</div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <Field
              label={t("phone.number")}
              value={state.phoneNum}
              onChange={(v) => set({ phoneNum: v.replace(/[^0-9 ]/g, "") })}
              mono
              placeholder="8975 0052"
              type="tel"
              inputStyle={{ height: 48, padding: "0 14px" }}
            />
          </div>
        </div>
        {phone.isValid && phone.formatted && (
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
            {t("phone.sendingTo")} <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{phone.formatted}</span>
          </div>
        )}
        {showInvalidWarning && (
          <div style={{ marginTop: 14, padding: 12, background: "#fff8f1", border: "1px solid #f5c89e", borderRadius: 12 }}>
            <div style={{ fontSize: 12.5, color: "#9a4a07", fontWeight: 600, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ display: "inline-flex", width: 16, height: 16, borderRadius: "50%", background: "#e0832a", color: "#fff", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>!</span>
              {t("phone.invalidTitle")}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-2)", lineHeight: 1.5, marginBottom: 10 }}>
              {t("phone.invalidBody", { cc: state.phoneCC || "+505" })}
            </div>
            <textarea
              value={state.phoneNote || ""}
              onChange={(e) => set({ phoneNote: e.target.value })}
              placeholder={t("phone.notePlaceholder")}
              rows={3}
              style={{
                width: "100%", resize: "vertical", minHeight: 64,
                padding: 10, borderRadius: 10, border: "1px solid var(--line)",
                fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff",
              }}
            />
          </div>
        )}
      </div>
      <div style={{ padding: 16, borderTop: "1px solid var(--line)", background: "#fff" }}>
        <PrimaryButton disabled={!ok} onClick={onNext}>{t("common.continue")}</PrimaryButton>
      </div>
    </div>
  );
}
