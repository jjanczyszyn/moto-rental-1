import React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  btnPrimary, inputStyle, labelStyle, cardStyle, tableWrap, tableStyle,
  thStyle, tdStyle,
} from "./shared";

interface Props { adminToken: string; }

export function Settings({ adminToken }: Props) {
  const cfg = useQuery(api.config.get);
  const update = useMutation(api.config.updateBusiness);
  const setCollector = useMutation(api.config.setPaymentMethodCollector);

  const [businessName, setBusinessName] = React.useState("");
  const [currency, setCurrency] = React.useState("USD");
  const [timezone, setTimezone] = React.useState("");
  const [dailyRate, setDailyRate] = React.useState("");
  const [weeklyRate, setWeeklyRate] = React.useState("");
  const [monthlyRate, setMonthlyRate] = React.useState("");
  const [deposit, setDeposit] = React.useState("");
  const [jjShare, setJjShare] = React.useState("");
  const [karenShare, setKarenShare] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const [err, setErr] = React.useState("");
  const initialised = React.useRef(false);

  React.useEffect(() => {
    if (!cfg || initialised.current) return;
    initialised.current = true;
    setBusinessName(cfg.businessName ?? "");
    setCurrency(cfg.currency ?? "USD");
    setTimezone(cfg.timezone ?? "");
    setDailyRate(String(cfg.dailyRate));
    setWeeklyRate(String(cfg.weeklyRate));
    setMonthlyRate(String(cfg.monthlyRate));
    setDeposit(String(cfg.deposit));
    setJjShare(String(cfg.jjSharePercentage ?? 70));
    setKarenShare(String(cfg.karenSharePercentage ?? 30));
  }, [cfg]);

  const save = async () => {
    setBusy(true); setMsg(""); setErr("");
    try {
      await update({
        adminToken,
        businessName: businessName || undefined,
        currency: currency || undefined,
        timezone: timezone || undefined,
        dailyRate: dailyRate ? parseFloat(dailyRate) : undefined,
        weeklyRate: weeklyRate ? parseFloat(weeklyRate) : undefined,
        monthlyRate: monthlyRate ? parseFloat(monthlyRate) : undefined,
        deposit: deposit ? parseFloat(deposit) : undefined,
        jjSharePercentage: jjShare ? parseFloat(jjShare) : undefined,
        karenSharePercentage: karenShare ? parseFloat(karenShare) : undefined,
      });
      setMsg("Saved.");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2 style={{ margin: 0, fontSize: 22 }}>Settings</h2>

      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Business</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: 10 }}>
          <Field label="Business name"><input value={businessName} onChange={(e) => setBusinessName(e.target.value)} style={inputStyle} /></Field>
          <Field label="Currency"><input value={currency} onChange={(e) => setCurrency(e.target.value)} style={inputStyle} /></Field>
          <Field label="Timezone"><input value={timezone} onChange={(e) => setTimezone(e.target.value)} style={inputStyle} /></Field>
          <Field label="Daily rate"><input type="number" inputMode="decimal" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} style={inputStyle} /></Field>
          <Field label="Weekly rate"><input type="number" inputMode="decimal" value={weeklyRate} onChange={(e) => setWeeklyRate(e.target.value)} style={inputStyle} /></Field>
          <Field label="Monthly rate"><input type="number" inputMode="decimal" value={monthlyRate} onChange={(e) => setMonthlyRate(e.target.value)} style={inputStyle} /></Field>
          <Field label="Deposit"><input type="number" inputMode="decimal" value={deposit} onChange={(e) => setDeposit(e.target.value)} style={inputStyle} /></Field>
          <Field label="JJ share %"><input type="number" inputMode="decimal" value={jjShare} onChange={(e) => setJjShare(e.target.value)} style={inputStyle} /></Field>
          <Field label="Karen share %"><input type="number" inputMode="decimal" value={karenShare} onChange={(e) => setKarenShare(e.target.value)} style={inputStyle} /></Field>
        </div>
        {msg && <div style={{ color: "#065f46", fontSize: 12, marginTop: 8 }}>{msg}</div>}
        {err && <div style={{ color: "#b91c1c", fontSize: 12, marginTop: 8 }}>{err}</div>}
        <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
          <button style={btnPrimary} onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</button>
        </div>
      </div>

      <div style={tableWrap}>
        <div style={{ padding: "10px 12px", background: "#fafafa", borderBottom: "1px solid var(--line)", fontWeight: 600, fontSize: 13 }}>
          Default payment-method collector
        </div>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Method</th>
              <th style={thStyle}>Default collector</th>
            </tr>
          </thead>
          <tbody>
            {(cfg?.paymentMethods ?? []).map((m) => (
              <tr key={m.id}>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 600 }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{m.id}</div>
                </td>
                <td style={tdStyle}>
                  <select
                    value={m.defaultCollector ?? "manual"}
                    onChange={(e) =>
                      setCollector({ adminToken, methodId: m.id, defaultCollector: e.target.value as any })
                    }
                    style={inputStyle}
                  >
                    <option value="JJ">JJ</option>
                    <option value="Karen">Karen</option>
                    <option value="manual">Manual</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}
