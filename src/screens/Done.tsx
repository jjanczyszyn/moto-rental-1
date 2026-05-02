import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { IconCheck, IconChat } from "../components/Icons";
import { ContractRow } from "../components/Common";

export function DoneScreen({ code, onHome }: { code: string; onHome: () => void }) {
  const r = useQuery(api.reservations.byCode, { code });
  const fmt = (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };
  const config = useQuery(api.config.get);
  const payMethod = config?.paymentMethods.find((p) => p.id === r?.payMethod) ?? null;
  const payLabel = payMethod?.label ?? "—";
  const isCash = r?.payMethod === "cash";
  const hour = r?.deliveryHour;
  const hourLbl = hour == null ? "—" : hour === 12 ? "12:00 pm" : hour < 12 ? `${hour}:00 am` : `${hour - 12}:00 pm`;

  return (
    <div className="phone-scroll" style={{ height: "100%", overflowY: "auto", background: "#fff" }}>
      <div style={{ padding: "40px 24px 24px", textAlign: "center" }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%", background: "#0a0a0a", color: "#fff",
          display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 18,
        }}>
          <IconCheck size={34} color="#fff" stroke={3} />
        </div>
        <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: -0.6 }}>You're all set.</h2>
        <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 8 }}>
          Karen will WhatsApp you to confirm. See you on the road.
        </p>
        <div style={{
          marginTop: 18, display: "inline-block", padding: "8px 14px",
          background: "#fafafa", border: "1px solid var(--line)", borderRadius: 999,
          fontFamily: "JetBrains Mono, monospace", fontSize: 13, fontWeight: 500,
        }}>
          RES · {code}
        </div>
      </div>

      {r && (
        <div style={{ padding: "0 16px" }}>
          <div style={{ border: "1px solid var(--line)", borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>
              Reservation details
            </div>
            <ContractRow l="Renter" v={`${r.docFirstName} ${r.docLastName}`} />
            <ContractRow l="Moto" v={r.bike ? `${r.bike.name} · ${r.bike.color}` : "—"} />
            <ContractRow l="Registration" v={r.bike?.plate || "—"} mono />
            <ContractRow l="Pick-up" v={`${fmt(r.startDate)} · ${hourLbl}`} />
            <ContractRow l="Drop-off" v={fmt(r.endDate)} />
            <ContractRow l="Days" v={`${r.days}`} />
            <ContractRow l="Address" v={r.deliveryAddr || "—"} />
            <ContractRow l="Payment" v={payLabel} />
            <ContractRow l="WhatsApp" v={`${r.phoneCC} ${r.phoneNum}`} mono />
            <div style={{ height: 1, background: "#ececec", margin: "12px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>Total</span>
              <span style={{ fontSize: 20, fontWeight: 700 }}>${r.totalUSD}</span>
            </div>
          </div>

          {payMethod && (
            <div style={{
              marginTop: 16, padding: 18,
              border: "1px solid var(--line)", borderRadius: 16, background: "#fafafa",
            }}>
              <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>
                {isCash ? "At delivery" : "How to pay"}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{payMethod.label}</div>
              <div style={{ fontSize: 13, color: "var(--muted)", fontFamily: isCash ? "inherit" : "JetBrains Mono, monospace", marginBottom: 10 }}>
                {payMethod.sub}
              </div>
              {payMethod.detail.length > 0 && (
                <div style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.6, fontFamily: isCash ? "inherit" : "JetBrains Mono, monospace" }}>
                  {payMethod.detail.map((line, i) => <div key={i}>{line}</div>)}
                </div>
              )}
              {!isCash && (
                <div style={{ marginTop: 14, padding: 12, background: "#fff", border: "1px solid var(--line)", borderRadius: 10, fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.5 }}>
                  Once paid, send a screenshot of the payment confirmation to Karen on WhatsApp so she can confirm your reservation.
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <a
              href={`https://wa.me/50589750052?text=${encodeURIComponent(
                isCash
                  ? `Hi Karen, I just booked ${code}. See you at delivery.`
                  : `Hi Karen, I just booked ${code} and I'm sending the payment screenshot.`
              )}`}
              target="_blank"
              rel="noreferrer"
              style={{
                flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center",
                gap: 8, padding: "14px 12px", borderRadius: 14, background: "#25D366",
                color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 600,
              }}
            >
              <IconChat size={18} color="#fff" />
              <span>{isCash ? "Message Karen" : "Send screenshot to Karen"}</span>
            </a>
          </div>

          <button
            onClick={onHome}
            style={{
              marginTop: 12, width: "100%", padding: 14, borderRadius: 14,
              border: "1px solid var(--line)", background: "#fff",
              fontSize: 14, fontWeight: 600, marginBottom: 24,
            }}
          >
            Back to home
          </button>
        </div>
      )}
    </div>
  );
}
