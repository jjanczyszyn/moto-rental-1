import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ReservationDraft, toISODate } from "../hooks/useReservationDraft";
import { StepHeader, ProgressBar, PrimaryButton, daysBetween } from "../components/Common";
import { BikeIllustration, bikeStyle, transmissionLabel, BikeRow } from "../components/BikeIllustration";
import { IconCheck } from "../components/Icons";
import { computeTotal } from "../lib/pricing";
import { useI18n } from "../i18n/I18nContext";

export function BikePickScreen({
  state, set, onBack, onNext, rates,
}: {
  state: ReservationDraft;
  set: (p: Partial<ReservationDraft>) => void;
  onBack: () => void;
  onNext: () => void;
  rates: { daily: number; weekly: number; monthly: number };
}) {
  const { t } = useI18n();
  const bikes = (useQuery(api.bikes.list) ?? []) as BikeRow[];
  const startISO = toISODate(state.startDate);
  const endISO = toISODate(state.endDate);
  const availability = useQuery(
    api.bikes.availability,
    startISO && endISO ? { startDate: startISO, endDate: endISO } : "skip"
  );
  const availMap = new Map<string, boolean>();
  if (availability) for (const a of availability) availMap.set(a.bikeId as unknown as string, a.available);

  const nights = state.startDate && state.endDate ? daysBetween(state.startDate, state.endDate) : 1;
  const rateLabel = nights >= 30
    ? t("bike.appliedMonthly")
    : nights >= 7
      ? t("bike.appliedWeekly")
      : t("bike.appliedDaily");

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#fff" }}>
      <StepHeader onBack={onBack} title={t("bike.title")} step={2} total={7} />
      <ProgressBar step={2} total={7} />
      <div style={{ padding: "12px 16px 0", fontSize: 12.5, color: "var(--muted)" }}>
        {nights} {nights === 1 ? t("common.day") : t("common.days")} · {rateLabel}
      </div>
      <div className="phone-scroll" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "12px 16px 100px" }}>
        {bikes.map((b) => {
          const selected = state.bikeId === b._id;
          const total = computeTotal(nights, rates);
          const s = bikeStyle(b.slug);
          const isAvailable = availMap.get(b._id) ?? true;
          return (
            <button
              key={b._id}
              onClick={() => set({ bikeId: b._id, bikeSlug: b.slug })}
              disabled={!isAvailable}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                border: `1.5px solid ${selected ? "var(--ink)" : "var(--line)"}`,
                background: "#fff",
                borderRadius: 18,
                padding: 0,
                marginBottom: 12,
                overflow: "hidden",
                cursor: isAvailable ? "pointer" : "not-allowed",
                opacity: isAvailable ? 1 : 0.5,
              }}
            >
              <div style={{ background: "#fafafa", padding: "14px 12px 4px" }}>
                <BikeIllustration accent={s.accent} body={s.body} seat={s.seat} image={b.image} height={140} label={b.name} />
              </div>
              <div style={{ padding: "12px 16px 14px", borderTop: "1px solid var(--line)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{b.name}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{b.color} · {transmissionLabel(b.type)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>
                      ${rates.daily}<span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 400 }}>{t("home.perDay")}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>${total} {t("bike.totalSuffix")}</div>
                  </div>
                </div>
                {!isAvailable && (
                  <div style={{ marginTop: 10, padding: 8, background: "#fef2f2", color: "#9a1a1a", borderRadius: 8, fontSize: 12 }}>
                    {t("bike.bookedDates")}
                  </div>
                )}
                {selected && (
                  <div style={{ marginTop: 12, padding: 10, background: "#fafafa", borderRadius: 10, fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <IconCheck size={16} color="#16a34a" />
                    <span>{t("bike.includes")}</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <div style={{ padding: 16, borderTop: "1px solid var(--line)", background: "#fff" }}>
        <PrimaryButton disabled={!state.bikeId} onClick={onNext}>{t("common.continue")}</PrimaryButton>
      </div>
    </div>
  );
}
