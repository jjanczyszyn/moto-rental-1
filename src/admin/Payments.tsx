import React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  StatusPill, fmtUSD, fmtPct, fmtDate, btnPrimary, btnGhost, inputStyle,
  labelStyle, tableWrap, tableStyle, thStyle, tdStyle, monthBoundsISO,
  monthLabelLong, PARTNERS, PAYMENT_TYPES, PAYMENT_STATUSES, ConfirmButton,
  cardStyle,
} from "./shared";

interface Props {
  adminToken: string;
  year: number;
  monthIdx0: number;
  setYear: (y: number) => void;
  setMonth: (m: number) => void;
}

export function Payments({ adminToken, year, monthIdx0, setYear, setMonth }: Props) {
  const { start, end } = monthBoundsISO(year, monthIdx0);
  const summary = useQuery(api.metrics.paymentMethodSummary, { fromISO: start, toISO: end });
  const allPayments = useQuery(api.payments.listAll, {
    fromMs: Date.parse(start),
    toMs: Date.parse(end),
    onlyReceived: false,
  });
  const reservations = useQuery(api.reservations.list, {});
  const removePayment = useMutation(api.payments.remove);
  const [recordFor, setRecordFor] = React.useState<Id<"reservations"> | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>Payments</h2>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <select value={monthIdx0} onChange={(e) => setMonth(parseInt(e.target.value))} style={inputStyle}>
            {monthLabelLong.map((m, i) => (<option key={m} value={i}>{m}</option>))}
          </select>
          <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} style={inputStyle}>
            {[year - 1, year, year + 1].map((y) => (<option key={y} value={y}>{y}</option>))}
          </select>
        </div>
      </header>

      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Payment method summary</div>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Method</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Amount</th>
              <th style={{ ...thStyle, textAlign: "right" }}>% of revenue</th>
              <th style={{ ...thStyle, textAlign: "right" }}>JJ collected</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Karen collected</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Payments</th>
              <th style={thStyle}>Default collector</th>
            </tr>
          </thead>
          <tbody>
            {(summary?.rows ?? []).map((row) => (
              <tr key={row.method}>
                <td style={tdStyle}><strong>{row.label}</strong></td>
                <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>{fmtUSD(row.amount)}</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>{fmtPct(row.percent)}</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>{fmtUSD(row.jjAmount)}</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>{fmtUSD(row.karenAmount)}</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>{row.count}</td>
                <td style={tdStyle}>{row.defaultCollector ?? "—"}</td>
              </tr>
            ))}
            {summary && summary.rows.length === 0 && (
              <tr><td colSpan={7} style={{ ...tdStyle, textAlign: "center", color: "var(--muted)" }}>No payments this month.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Payments this month</div>
        <select
          onChange={(e) => {
            const id = e.target.value;
            if (id) setRecordFor(id as Id<"reservations">);
            e.target.value = "";
          }}
          style={inputStyle}
          defaultValue=""
        >
          <option value="">+ Record payment for…</option>
          {(reservations ?? []).map((r) => (
            <option key={r._id} value={r._id}>
              {r.code} · {r.docFirstName} {r.docLastName} · {fmtUSD(r.totalUSD)}
            </option>
          ))}
        </select>
      </div>

      <div style={tableWrap}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Received</th>
              <th style={thStyle}>Booking</th>
              <th style={thStyle}>Method</th>
              <th style={thStyle}>Type</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Amount</th>
              <th style={thStyle}>Collected by</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Notes</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {(allPayments ?? []).map((p) => {
              const r = (reservations ?? []).find((rr) => rr._id === p.reservationId);
              return (
                <tr key={p._id}>
                  <td style={tdStyle}>{p.receivedAt ? fmtDate(new Date(p.receivedAt).toISOString()) : "—"}</td>
                  <td style={tdStyle}>
                    {r ? (
                      <>
                        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>{r.code}</span>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>{r.docFirstName} {r.docLastName}</div>
                      </>
                    ) : "—"}
                  </td>
                  <td style={tdStyle}>{p.method}</td>
                  <td style={tdStyle}><StatusPill status={p.paymentType} /></td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>{fmtUSD(p.amount)}</td>
                  <td style={tdStyle}>{p.collectedBy}</td>
                  <td style={tdStyle}><StatusPill status={p.status} /></td>
                  <td style={{ ...tdStyle, fontSize: 12, color: "var(--muted)" }}>{p.notes ?? ""}</td>
                  <td style={tdStyle}>
                    <ConfirmButton label="Delete" confirmLabel="Sure?" onConfirm={() => removePayment({ adminToken, paymentId: p._id })} />
                  </td>
                </tr>
              );
            })}
            {allPayments && allPayments.length === 0 && (
              <tr><td colSpan={9} style={{ ...tdStyle, textAlign: "center", color: "var(--muted)" }}>No payments this month.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {recordFor && (
        <RecordPaymentModal
          reservationId={recordFor}
          adminToken={adminToken}
          onClose={() => setRecordFor(null)}
        />
      )}
    </div>
  );
}

function RecordPaymentModal({
  reservationId, adminToken, onClose,
}: { reservationId: Id<"reservations">; adminToken: string; onClose: () => void }) {
  const cfg = useQuery(api.config.get);
  const reservation = useQuery(api.reservations.list, {});
  const r = reservation?.find((x) => x._id === reservationId);
  const record = useMutation(api.payments.record);

  const [amount, setAmount] = React.useState(r ? String(r.totalUSD) : "");
  const [method, setMethod] = React.useState<string>("cash");
  const [collectedBy, setCollectedBy] = React.useState<"JJ" | "Karen">("Karen");
  const [paymentType, setPaymentType] = React.useState<typeof PAYMENT_TYPES[number]>("full_payment");
  const [status, setStatus] = React.useState<typeof PAYMENT_STATUSES[number]>("received");
  const [receivedDate, setReceivedDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    if (!cfg) return;
    const m = cfg.paymentMethods.find((x) => x.id === method);
    if (m?.defaultCollector && m.defaultCollector !== "manual") {
      setCollectedBy(m.defaultCollector);
    }
  }, [method, cfg]);

  React.useEffect(() => {
    if (r && !amount) setAmount(String(r.totalUSD));
  }, [r, amount]);

  if (!r) return null;

  const submit = async () => {
    setBusy(true); setErr("");
    try {
      const amt = parseFloat(amount);
      if (!amt || amt <= 0) throw new Error("Amount must be greater than zero.");
      const receivedAt = status === "received"
        ? new Date(receivedDate + "T12:00:00").getTime()
        : undefined;
      await record({
        adminToken,
        reservationId,
        amount: amt,
        method,
        collectedBy,
        paymentType,
        status,
        receivedAt,
        notes: notes || undefined,
      });
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 20,
    }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 20, maxWidth: 520, width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <strong>Record payment for {r.code}</strong>
          <button style={btnGhost} onClick={onClose}>Close</button>
        </div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>
          {r.docFirstName} {r.docLastName} · {fmtUSD(r.totalUSD)} total · {r.days} days
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="Amount (USD)">
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Method">
            <select value={method} onChange={(e) => setMethod(e.target.value)} style={inputStyle}>
              {(cfg?.paymentMethods ?? []).map((m) => (<option key={m.id} value={m.id}>{m.label}</option>))}
            </select>
          </Field>
          <Field label="Collected by">
            <select value={collectedBy} onChange={(e) => setCollectedBy(e.target.value as any)} style={inputStyle}>
              {PARTNERS.map((p) => (<option key={p} value={p}>{p}</option>))}
            </select>
          </Field>
          <Field label="Payment type">
            <select value={paymentType} onChange={(e) => setPaymentType(e.target.value as any)} style={inputStyle}>
              {PAYMENT_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
            </select>
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} style={inputStyle}>
              {PAYMENT_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </Field>
          <Field label="Received date">
            <input type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} style={inputStyle} />
          </Field>
        </div>
        <Field label="Notes">
          <input value={notes} onChange={(e) => setNotes(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
        </Field>
        {err && <div style={{ color: "#b91c1c", fontSize: 12, marginTop: 8 }}>{err}</div>}
        <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button style={btnGhost} onClick={onClose}>Cancel</button>
          <button style={btnPrimary} onClick={submit} disabled={busy}>{busy ? "Saving…" : "Record"}</button>
        </div>
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
