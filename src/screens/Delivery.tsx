import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ReservationDraft } from "../hooks/useReservationDraft";
import { StepHeader, ProgressBar, PrimaryButton, Field } from "../components/Common";
import { useI18n } from "../i18n/I18nContext";

export function DeliveryScreen({
  state, set, onBack, onConfirm,
  submitting,
}: {
  state: ReservationDraft;
  set: (p: Partial<ReservationDraft>) => void;
  onBack: () => void;
  onConfirm: () => void;
  submitting: boolean;
}) {
  const { t, intlLocale } = useI18n();
  const config = useQuery(api.config.get);
  const startHour = config?.deliveryStart ?? 7;
  const endHour = config?.deliveryEnd ?? 20;
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

  // If the rental starts today, gray out hours less than 2h from now so we
  // never accept a delivery slot we couldn't physically make. minHour is the
  // earliest hour-of-day the customer can pick.
  const now = new Date();
  const isToday =
    !!state.startDate &&
    state.startDate.toDateString() === now.toDateString();
  const minHour = isToday
    ? Math.ceil(now.getHours() + now.getMinutes() / 60 + 2)
    : 0;

  // If the previously-picked hour just became too soon (e.g. user is loading
  // this screen later in the day), drop it so the Confirm button can't fire
  // on a stale value.
  React.useEffect(() => {
    if (state.deliveryHour != null && state.deliveryHour < minHour) {
      set({ deliveryHour: null });
    }
  }, [minHour, state.deliveryHour, set]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#fff" }}>
      <StepHeader onBack={onBack} title={t("delivery.title")} step={7} total={7} />
      <ProgressBar step={7} total={7} />
      <div className="phone-scroll" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "8px 16px 16px" }}>
        <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.5, margin: "8px 0 16px" }}>
          {t("delivery.intro", {
            day: state.startDate
              ? state.startDate.toLocaleDateString(intlLocale, { weekday: "long", month: "short", day: "numeric" })
              : "—",
            start: `${startHour}am`,
            end: `${endHour > 12 ? endHour - 12 : endHour}${endHour >= 12 ? "pm" : "am"}`,
          })}
        </p>

        <Field label={t("delivery.addressLabel")} value={state.deliveryAddr} onChange={(v) => set({ deliveryAddr: v })} placeholder={t("delivery.addressPlaceholder")} />

        <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 0.6, textTransform: "uppercase", fontWeight: 600, margin: "6px 0 10px" }}>{t("delivery.pickTime")}</div>
        {isToday && minHour > startHour && (
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
            {t("delivery.todayNotice")}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {hours.map((h) => {
            const label = h === 12 ? "12:00 pm" : h < 12 ? `${h}:00 am` : `${h - 12}:00 pm`;
            const sel = state.deliveryHour === h;
            const disabled = h < minHour;
            return (
              <button
                key={h}
                disabled={disabled}
                onClick={() => set({ deliveryHour: h })}
                style={{
                  padding: "12px 6px", borderRadius: 12,
                  border: `1.5px solid ${sel ? "var(--ink)" : "var(--line)"}`,
                  background: disabled ? "#f4f4f4" : sel ? "var(--ink)" : "#fff",
                  color: disabled ? "#b8b8b8" : sel ? "#fff" : "var(--ink)",
                  fontSize: 13, fontWeight: 600,
                  cursor: disabled ? "not-allowed" : "pointer",
                  textDecoration: disabled ? "line-through" : "none",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ padding: 16, borderTop: "1px solid var(--line)", background: "#fff" }}>
        <PrimaryButton disabled={!state.deliveryHour || !state.deliveryAddr || submitting} onClick={onConfirm}>
          {submitting ? t("delivery.submitting") : t("delivery.confirmCta")}
        </PrimaryButton>
      </div>
    </div>
  );
}
