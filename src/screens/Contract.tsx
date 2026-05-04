import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ReservationDraft, SignatureDraft } from "../hooks/useReservationDraft";
import { StepHeader, ProgressBar, PrimaryButton, ContractRow, daysBetween } from "../components/Common";
import { BikeRow } from "../components/BikeIllustration";
import { computeTotal } from "../lib/pricing";

function tabStyle(active: boolean): React.CSSProperties {
  return {
    flex: 1, padding: "8px 12px", borderRadius: 8, border: "none",
    background: active ? "#fff" : "transparent",
    fontSize: 12.5, fontWeight: 600, color: active ? "var(--ink)" : "var(--muted)",
    boxShadow: active ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
  };
}

function SignaturePad({
  value,
  onChange,
}: {
  value: SignatureDraft | null;
  onChange: (s: SignatureDraft) => void;
}) {
  const [mode, setMode] = React.useState<"draw" | "type">(value?.mode === "type" ? "type" : "draw");
  const [typed, setTyped] = React.useState(value?.typed || "");
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const drawing = React.useRef(false);
  const last = React.useRef<{ x: number; y: number } | null>(null);

  React.useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * dpr; c.height = rect.height * dpr;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = "#0a0a0a"; ctx.lineWidth = 2.2;
  }, [mode]);

  const pos = (e: React.MouseEvent | React.TouchEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    const t = "touches" in e ? e.touches[0] : (e as React.MouseEvent);
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  };
  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    drawing.current = true;
    last.current = pos(e);
  };
  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current!.getContext("2d");
    if (!ctx || !last.current) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    onChange({ mode: "draw", drawn: true });
  };
  const end = () => { drawing.current = false; };
  const clear = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    ctx?.clearRect(0, 0, c.width, c.height);
    onChange({ mode: "draw", drawn: false });
  };

  // Expose canvas-to-blob via a global so the parent screen can grab it.
  React.useEffect(() => {
    if (mode === "draw" && canvasRef.current) {
      (window as unknown as { __sigCanvas?: HTMLCanvasElement }).__sigCanvas = canvasRef.current;
    }
  }, [mode]);

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 10, padding: 4, background: "#f4f4f4", borderRadius: 10 }}>
        <button onClick={() => setMode("draw")} style={tabStyle(mode === "draw")}>Draw</button>
        <button onClick={() => setMode("type")} style={tabStyle(mode === "type")}>Type</button>
      </div>
      {mode === "draw" ? (
        <div>
          <div style={{ position: "relative", height: 140, border: "1px dashed #d8d8d8", borderRadius: 12, background: "#fff", overflow: "hidden" }}>
            <canvas
              ref={canvasRef}
              style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }}
              onMouseDown={start}
              onMouseMove={move}
              onMouseUp={end}
              onMouseLeave={end}
              onTouchStart={start}
              onTouchMove={move}
              onTouchEnd={end}
            />
            <div style={{ position: "absolute", left: 14, bottom: 8, fontSize: 10, color: "#bbb", letterSpacing: 1, textTransform: "uppercase" }}>Sign here ×</div>
          </div>
          <button onClick={clear} style={{ background: "transparent", border: "none", color: "var(--muted)", fontSize: 12, padding: "6px 0" }}>Clear</button>
        </div>
      ) : (
        <div>
          <input
            value={typed}
            onChange={(e) => { setTyped(e.target.value); onChange({ mode: "type", typed: e.target.value }); }}
            placeholder="Type your full name"
            style={{
              width: "100%", padding: "14px 14px", borderRadius: 12, border: "1px solid var(--line)",
              fontSize: 22, fontFamily: "Caveat, cursive", outline: "none", background: "#fff",
            }}
          />
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
            By typing your name you agree it represents your handwritten signature.
          </div>
        </div>
      )}
    </div>
  );
}

export function ContractScreen({
  state, set, onBack, onNext,
}: {
  state: ReservationDraft;
  set: (p: Partial<ReservationDraft>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const bikes = (useQuery(api.bikes.list) ?? []) as BikeRow[];
  const config = useQuery(api.config.get);
  const bike = bikes.find((b) => b._id === state.bikeId);
  const fmt = (d: Date | null) => (d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—");
  const sigOk = !!(state.signature && (state.signature.drawn || (state.signature.typed && state.signature.typed.length >= 3)));
  const nights = daysBetween(state.startDate, state.endDate);
  const phoneCC = state.phoneCC || "+505";
  const payMethod = config?.paymentMethods.find((p) => p.id === state.payMethod)?.label ?? "—";
  const rates = {
    daily: config?.dailyRate ?? 20,
    weekly: config?.weeklyRate ?? 120,
    monthly: config?.monthlyRate ?? 450,
  };
  const total = nights > 0 ? computeTotal(nights, rates) : 0;
  const deposit = config?.deposit ?? 100;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#fff" }}>
      <StepHeader onBack={onBack} title="Sign the contract" step={6} total={7} />
      <ProgressBar step={6} total={7} />
      <div className="phone-scroll" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "8px 16px 16px" }}>
        <div style={{ padding: 16, border: "1px solid var(--line)", borderRadius: 14, background: "#fafafa" }}>
          <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>Rental agreement</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4, marginBottom: 12 }}>Karen & JJ Moto Rental</div>
          <ContractRow l="Renter" v={`${state.docFirstName || "—"} ${state.docLastName || ""}`} />
          <ContractRow l="Document" v={state.docNumber || "—"} mono />
          <ContractRow l="Country" v={state.docCountry || "—"} />
          <ContractRow l="Moto" v={bike ? `${bike.name} · ${bike.color}` : "—"} />
          <ContractRow l="Registration" v={bike?.plate || "—"} mono />
          <ContractRow l="Pick-up" v={fmt(state.startDate)} />
          <ContractRow l="Drop-off" v={fmt(state.endDate)} />
          <ContractRow l="Duration" v={nights ? `${nights} ${nights === 1 ? "day" : "days"}` : "—"} />
          <ContractRow l="Payment" v={payMethod} />
          <ContractRow l="WhatsApp" v={`${phoneCC} ${state.phoneNum || "—"}`} mono />
          <div style={{ height: 1, background: "#ececec", margin: "14px 0 10px" }} />
          <ContractRow l="Refundable deposit" v={`$${deposit}`} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "6px 0 4px" }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Total rental</span>
            <span style={{ fontSize: 18, fontWeight: 700 }}>${total}</span>
          </div>
          <div style={{ height: 1, background: "#ececec", margin: "10px 0" }} />
          <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>
            Terms & conditions
          </div>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: "var(--ink-2)", lineHeight: 1.55 }}>
            <li><b>Vehicle.</b> The Owner (Karen & JJ Moto Rental) rents the above motorcycle to the Renter for the dates listed. The motorcycle is delivered with a surf rack, two helmets and roadside assistance during business hours.</li>
            <li><b>Renter's responsibility.</b> The Renter accepts the motorcycle in good working condition and agrees to return it in the same condition. The Renter is the sole responsible operator and must hold a valid driver's license.</li>
            <li><b>Damage.</b> The Renter is responsible for any and all damage to the motorcycle, accessories or third-party property occurring during the rental period, regardless of cause or fault. The Renter agrees to compensate the Owner for the full cost of repairs.</li>
            <li><b>Loss or theft.</b> In the event of loss or theft of the motorcycle, helmets, surf rack or keys during the rental period, the Renter agrees to compensate the Owner for the <b>full market replacement value</b> of the motorcycle and any missing accessories, payable within 14 days of the incident.</li>
            <li><b>Use.</b> The motorcycle may not be used for illegal activity or operated under the influence of alcohol or drugs.</li>
            <li><b>Insurance.</b> The motorcycle carries Nicaraguan third-party liability insurance only. Personal injury, medical expenses and damage to the motorcycle itself are <b>not</b> covered.</li>
            <li><b>Helmets.</b> Helmets must be worn at all times by both rider and passenger.</li>
            <li><b>Deposit.</b> A refundable deposit of <b>${config?.deposit ?? 100} USD</b> is held at delivery and returned in full upon return.</li>
            <li><b>Late return.</b> Returns later than the agreed drop-off date will be billed at the applicable daily rate per started day.</li>
            <li><b>Acceptance.</b> By signing below, the Renter confirms they have read, understood and agree to all terms.</li>
          </ol>
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Your signature</div>
          <SignaturePad value={state.signature} onChange={(s) => set({ signature: { ...(state.signature || {}), ...s } })} />
        </div>
      </div>
      <div style={{ padding: 16, borderTop: "1px solid var(--line)", background: "#fff" }}>
        <PrimaryButton disabled={!sigOk} onClick={onNext}>I agree & continue</PrimaryButton>
      </div>
    </div>
  );
}
