import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { IconCheck, IconChat } from "../components/Icons";
import { ContractRow } from "../components/Common";
import { PaymentIcon } from "../components/PaymentIcon";

function buildKarenMessage({
  code, date, hour, address, isCash,
}: {
  code: string;
  date: string;
  hour: string;
  address: string;
  isCash: boolean;
}): string {
  const parts = [
    `Hi Karen, I just booked ${code}.`,
    `Delivery on ${date} at ${hour} to ${address}.`,
  ];
  if (!isCash) parts.push("I'm sending the payment screenshot.");
  parts.push("Waiting for your confirmation!");
  return parts.join(" ");
}

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
  const deposit = config?.deposit ?? 100;
  const amountToPay = (r?.totalUSD ?? 0) + deposit;

  return (
    <div className="phone-scroll" style={{ height: "100%", overflowY: "auto", overflowX: "hidden", background: "#fff" }}>
      <div style={{ padding: "40px 24px 24px", textAlign: "center" }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%", background: "#0a0a0a", color: "#fff",
          display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 18,
        }}>
          <IconCheck size={34} color="#fff" stroke={3} />
        </div>
        <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: -0.6 }}>You're all set.</h2>
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
          {payMethod && (
            <div style={{
              padding: 18,
              border: "1px solid var(--line)", borderRadius: 16, background: "#fafafa",
            }}>
              <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>
                {isCash ? "At delivery" : "How to pay"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "#fff", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <PaymentIcon id={payMethod.id} size={22} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{payMethod.label}</div>
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)", fontFamily: isCash ? "inherit" : "JetBrains Mono, monospace", marginBottom: 10 }}>
                {payMethod.sub}
              </div>
              {payMethod.detail.length > 0 && (
                <div style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.6, fontFamily: isCash ? "inherit" : "JetBrains Mono, monospace" }}>
                  {payMethod.detail.map((line, i) => <div key={i}>{line}</div>)}
                </div>
              )}
              <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700 }}>
                Amount: ${amountToPay}
                <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500, marginLeft: 6 }}>
                  (${r.totalUSD} rental + ${deposit} refundable deposit)
                </span>
              </div>
              {payMethod.url && (
                <a
                  href={payMethod.url}
                  target={payMethod.url.startsWith("http") ? "_blank" : undefined}
                  rel={payMethod.url.startsWith("http") ? "noreferrer" : undefined}
                  style={{
                    marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "10px 14px", borderRadius: 10,
                    background: "var(--ink)", color: "#fff",
                    textDecoration: "none", fontSize: 13, fontWeight: 600,
                  }}
                >
                  Open {payMethod.label} →
                </a>
              )}
              {!isCash && (
                <div style={{ marginTop: 14, padding: 12, background: "#fff", border: "1px solid var(--line)", borderRadius: 10, fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.5 }}>
                  Once paid, send a <b>screenshot of the payment confirmation</b> to Karen on WhatsApp so she can confirm your reservation.
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: 16, border: "1px solid var(--line)", borderRadius: 16, padding: 18 }}>
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
            <ContractRow l="Rental" v={`$${r.totalUSD}`} />
            <ContractRow l="Refundable deposit" v={`$${deposit}`} />
            <div style={{ height: 1, background: "#ececec", margin: "10px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Total to pay</span>
              <span style={{ fontSize: 20, fontWeight: 700 }}>${amountToPay}</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <a
              href={`https://wa.me/50589750052?text=${encodeURIComponent(buildKarenMessage({
                code,
                date: fmt(r.startDate),
                hour: hourLbl,
                address: r.deliveryAddr || "—",
                isCash,
              }))}`}
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
