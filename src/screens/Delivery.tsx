import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ReservationDraft } from "../hooks/useReservationDraft";
import { StepHeader, ProgressBar, PrimaryButton, Field } from "../components/Common";

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
  const config = useQuery(api.config.get);
  const startHour = config?.deliveryStart ?? 7;
  const endHour = config?.deliveryEnd ?? 20;
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#fff" }}>
      <StepHeader onBack={onBack} title="Delivery time" step={7} total={7} />
      <ProgressBar step={7} total={7} />
      <div className="phone-scroll" style={{ flex: 1, overflowY: "auto", padding: "8px 16px 16px" }}>
        <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.5, margin: "8px 0 16px" }}>
          We'll bring the moto to your address on{" "}
          <b>
            {state.startDate
              ? state.startDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
              : "—"}
          </b>
          . Pick a time between {startHour}am and {endHour > 12 ? endHour - 12 : endHour}{endHour >= 12 ? "pm" : "am"}.
        </p>

        <Field label="Delivery address" value={state.deliveryAddr} onChange={(v) => set({ deliveryAddr: v })} placeholder="Hotel, hostel, or pin" />

        <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 0.6, textTransform: "uppercase", fontWeight: 600, margin: "6px 0 10px" }}>Pick a time</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {hours.map((h) => {
            const label = h === 12 ? "12:00 pm" : h < 12 ? `${h}:00 am` : `${h - 12}:00 pm`;
            const sel = state.deliveryHour === h;
            return (
              <button
                key={h}
                onClick={() => set({ deliveryHour: h })}
                style={{
                  padding: "12px 6px", borderRadius: 12,
                  border: `1.5px solid ${sel ? "var(--ink)" : "var(--line)"}`,
                  background: sel ? "var(--ink)" : "#fff",
                  color: sel ? "#fff" : "var(--ink)",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
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
          {submitting ? "Submitting…" : "Confirm reservation"}
        </PrimaryButton>
      </div>
    </div>
  );
}
