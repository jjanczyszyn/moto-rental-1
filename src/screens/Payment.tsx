import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ReservationDraft } from "../hooks/useReservationDraft";
import { StepHeader, ProgressBar, PrimaryButton } from "../components/Common";
import { IconCheck, IconShield } from "../components/Icons";
import { PaymentIcon } from "../components/PaymentIcon";
import { useI18n } from "../i18n/I18nContext";

export function PaymentScreen({
  state, set, onBack, onNext,
}: {
  state: ReservationDraft;
  set: (p: Partial<ReservationDraft>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const { t } = useI18n();
  const config = useQuery(api.config.get);
  const methods = (config?.paymentMethods ?? []).filter((m) => m.enabled);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#fff" }}>
      <StepHeader onBack={onBack} title={t("payment.title")} step={5} total={7} />
      <ProgressBar step={5} total={7} />
      <div className="phone-scroll" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "8px 16px 16px" }}>
        <div style={{ marginTop: 8, marginBottom: 14, padding: 14, background: "#fafafa", borderRadius: 12, fontSize: 13, color: "var(--ink-2)", display: "flex", gap: 10, alignItems: "center" }}>
          <IconShield size={18} />
          <div>{t("payment.depositNote", { deposit: config?.deposit ?? 100 })}</div>
        </div>
        {methods.map((m) => {
          const selected = state.payMethod === m.id;
          return (
            <div
              key={m.id}
              style={{
                borderRadius: 14, marginBottom: 8, overflow: "hidden",
                border: `1.5px solid ${selected ? "var(--ink)" : "var(--line)"}`,
                background: selected ? "#fafafa" : "#fff",
              }}
            >
              <button
                onClick={() => set({ payMethod: m.id })}
                style={{
                  display: "flex", alignItems: "center", gap: 14, width: "100%",
                  padding: "14px 14px", border: "none", background: "transparent",
                  textAlign: "left", cursor: "pointer",
                }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PaymentIcon id={m.id} size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{m.label}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: m.id !== "cash" ? "JetBrains Mono, monospace" : "inherit" }}>{m.sub}</div>
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%",
                  border: `1.5px solid ${selected ? "var(--ink)" : "#d8d8d8"}`,
                  background: selected ? "var(--ink)" : "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>{selected && <IconCheck size={12} color="#fff" stroke={3} />}</div>
              </button>
              {selected && (m.detail.length > 0 || m.url) && (
                <div style={{ padding: "10px 14px 14px", borderTop: "1px solid var(--line)", fontSize: 12, color: "var(--ink-2)", lineHeight: 1.6, fontFamily: "JetBrains Mono, monospace" }}>
                  {m.detail.map((line, i) => <div key={i}>{line}</div>)}
                  {m.url && (
                    <a
                      href={m.url}
                      target={m.url.startsWith("http") ? "_blank" : undefined}
                      rel={m.url.startsWith("http") ? "noreferrer" : undefined}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "8px 12px", borderRadius: 8,
                        background: "var(--ink)", color: "#fff",
                        textDecoration: "none", fontSize: 12, fontWeight: 600,
                        fontFamily: "Inter Tight, -apple-system, system-ui, sans-serif",
                      }}
                    >
                      {t("payment.openMethod", { label: m.label })}
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ padding: 16, borderTop: "1px solid var(--line)", background: "#fff" }}>
        <PrimaryButton disabled={!state.payMethod} onClick={onNext}>{t("common.continue")}</PrimaryButton>
      </div>
    </div>
  );
}
