import React from "react";
import { ReservationDraft } from "../hooks/useReservationDraft";
import { StepHeader, ProgressBar, PrimaryButton, daysBetween, sameDay } from "../components/Common";
import { computeTotal } from "../lib/pricing";
import { useI18n } from "../i18n/I18nContext";

function MonthGrid({
  year, month, start, end, onPick,
}: {
  year: number; month: number; start: Date | null; end: Date | null; onPick: (d: Date) => void;
}) {
  const { intlLocale, locale } = useI18n();
  const first = new Date(year, month, 1);
  const fmtMonth = (d: Date) => d.toLocaleDateString(intlLocale, { month: "long", year: "numeric" });
  const dayLabels = locale === "es"
    ? ["D", "L", "M", "M", "J", "V", "S"]
    : ["S", "M", "T", "W", "T", "F", "S"];
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const cells: Array<Date | null> = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return (
    <div style={{ padding: "8px 16px 24px" }}>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{fmtMonth(first)}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {dayLabels.map((l, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: 11, color: "var(--muted)", padding: "4px 0" }}>{l}</div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const past = d < today;
          const isStart = sameDay(d, start);
          const isEnd = sameDay(d, end);
          const inRange = !!(start && end && d > start && d < end);
          const selected = isStart || isEnd;
          return (
            <button
              key={i}
              disabled={past}
              onClick={() => onPick(d)}
              style={{
                border: "none",
                background: selected ? "var(--ink)" : inRange ? "#f3f3f3" : "transparent",
                color: selected ? "#fff" : past ? "#cfcfcf" : "var(--ink)",
                borderRadius: selected ? 999 : inRange ? 0 : 999,
                aspectRatio: "1",
                fontSize: 14,
                fontWeight: selected ? 700 : 500,
                textDecoration: past ? "line-through" : "none",
                cursor: past ? "not-allowed" : "pointer",
                padding: 0,
              }}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CalendarScreen({
  state, set, onBack, onNext, rates,
}: {
  state: ReservationDraft;
  set: (p: Partial<ReservationDraft>) => void;
  onBack: () => void;
  onNext: () => void;
  rates: { daily: number; weekly: number; monthly: number };
}) {
  const { t, intlLocale } = useI18n();
  const { startDate, endDate } = state;
  const today = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const onPick = (d: Date) => {
    if (!startDate || (startDate && endDate)) { set({ startDate: d, endDate: null }); return; }
    if (d <= startDate) { set({ startDate: d, endDate: null }); return; }
    set({ endDate: d });
  };
  const nights = startDate && endDate ? daysBetween(startDate, endDate) : 0;
  const fmt = (d: Date | null) => (d ? d.toLocaleDateString(intlLocale, { month: "short", day: "numeric" }) : "—");
  const nightsLabel = nights
    ? `${nights} ${nights === 1 ? t("common.day") : t("common.days")}`
    : t("calendar.selectDates");

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#fff" }}>
      <StepHeader onBack={onBack} title={t("calendar.title")} step={1} total={7} />
      <ProgressBar step={1} total={7} />
      <div style={{ padding: "14px 16px 8px", display: "flex", gap: 8 }}>
        <div style={pillBox(!!startDate)}>
          <div style={pillLabel}>{t("calendar.pickup")}</div>
          <div style={pillValue}>{fmt(startDate)}</div>
        </div>
        <div style={pillBox(!!endDate)}>
          <div style={pillLabel}>{t("calendar.dropoff")}</div>
          <div style={pillValue}>{fmt(endDate)}</div>
        </div>
      </div>
      <div className="phone-scroll" style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {months.map(({ y, m }) => (
          <MonthGrid key={`${y}-${m}`} year={y} month={m} start={startDate} end={endDate} onPick={onPick} />
        ))}
      </div>
      <div style={{ padding: 16, borderTop: "1px solid var(--line)", background: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, fontSize: 13 }}>
          <span style={{ color: "var(--muted)" }}>{nightsLabel}</span>
          {nights > 0 && (
            <span style={{ fontWeight: 600 }}>
              ${computeTotal(nights, rates)} <span style={{ color: "var(--muted)", fontWeight: 400 }}>{t("calendar.est")}</span>
            </span>
          )}
        </div>
        <PrimaryButton disabled={!startDate || !endDate} onClick={onNext}>{t("common.continue")}</PrimaryButton>
      </div>
    </div>
  );
}

const pillBox = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: "10px 14px",
  borderRadius: 12,
  border: `1px solid ${active ? "var(--ink)" : "var(--line)"}`,
  background: active ? "#fafafa" : "#fff",
});
const pillLabel: React.CSSProperties = { fontSize: 10.5, color: "var(--muted)", letterSpacing: 0.6, textTransform: "uppercase", fontWeight: 600 };
const pillValue: React.CSSProperties = { fontSize: 14, fontWeight: 600, marginTop: 2 };
