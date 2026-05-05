import React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import {
  StatusPill, fmtUSD, fmtDateShort, btnPrimary, btnGhost, inputStyle,
  labelStyle, tableWrap, tableStyle, thStyle, tdStyle, RESERVATION_STATUSES,
  SOURCE_OPTIONS, isoToday,
} from "./shared";

interface Props { adminToken: string; }

export function Bookings({ adminToken }: Props) {
  const [statusFilter, setStatusFilter] = React.useState<string>("");
  const [sourceFilter, setSourceFilter] = React.useState<string>("");
  const [showNew, setShowNew] = React.useState(false);
  const [editing, setEditing] = React.useState<Id<"reservations"> | null>(null);

  const bookings = useQuery(
    api.reservations.listForAdmin,
    {
      status: statusFilter || undefined,
      source: sourceFilter || undefined,
    }
  );
  const setStatus = useMutation(api.reservations.setStatus);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <header style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>Bookings</h2>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={inputStyle}>
          <option value="">All statuses</option>
          {RESERVATION_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
        </select>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} style={inputStyle}>
          <option value="">All sources</option>
          {SOURCE_OPTIONS.map((s) => (<option key={s} value={s}>{s.replace("_", " ")}</option>))}
        </select>
        <button style={{ ...btnPrimary, marginLeft: "auto" }} onClick={() => setShowNew(true)}>+ New booking</button>
      </header>

      {showNew && (
        <NewBookingForm
          adminToken={adminToken}
          onClose={() => setShowNew(false)}
        />
      )}

      <div style={tableWrap}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Code</th>
              <th style={thStyle}>Customer</th>
              <th style={thStyle}>Bike</th>
              <th style={thStyle}>Dates</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Days</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Total</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Paid</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Pay status</th>
              <th style={thStyle}>Source</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {(bookings ?? []).map((r) => (
              <tr key={r._id}>
                <td style={{ ...tdStyle, fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>{r.code}</td>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 600 }}>{r.docFirstName} {r.docLastName}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{r.phoneCC} {r.phoneNum}</div>
                </td>
                <td style={tdStyle}>
                  {r.bike ? `${r.bike.name} ${r.bike.color}` : "—"}
                  {r.bike && (<div style={{ fontSize: 11, color: "var(--muted)" }}>{r.bike.plate}</div>)}
                </td>
                <td style={tdStyle}>
                  {fmtDateShort(r.startDate)} → {fmtDateShort(r.endDate)}
                </td>
                <td style={{ ...tdStyle, textAlign: "right" }}>{r.days}</td>
                <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>{fmtUSD(r.totalUSD)}</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>{fmtUSD(r.paid)}</td>
                <td style={tdStyle}><StatusPill status={r.status} /></td>
                <td style={tdStyle}><StatusPill status={r.payStatus} /></td>
                <td style={{ ...tdStyle, textTransform: "capitalize" }}>{(r.source ?? "—").replace("_", " ")}</td>
                <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button style={btnGhost} onClick={() => setEditing(r._id)}>Edit</button>
                    <StatusActions r={r} onChange={(s) => setStatus({ id: r._id, status: s, adminToken })} />
                  </div>
                </td>
              </tr>
            ))}
            {bookings && bookings.length === 0 && (
              <tr>
                <td colSpan={11} style={{ ...tdStyle, textAlign: "center", color: "var(--muted)", padding: 24 }}>
                  No bookings match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditBookingForm
          reservationId={editing}
          adminToken={adminToken}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function StatusActions({
  r, onChange,
}: {
  r: { status: string; _id: Id<"reservations"> };
  onChange: (s: "pending" | "confirmed" | "active" | "returned" | "cancelled") => void;
}) {
  return (
    <select
      value={r.status}
      onChange={(e) => onChange(e.target.value as any)}
      style={{ ...inputStyle, fontSize: 12, padding: "6px 8px" }}
    >
      {RESERVATION_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
    </select>
  );
}

function NewBookingForm({
  adminToken, onClose,
}: { adminToken: string; onClose: () => void }) {
  const bikes = useQuery(api.bikes.listAll) ?? [];
  const create = useMutation(api.reservations.adminCreate);
  const today = isoToday();
  const [bikeId, setBikeId] = React.useState<string>("");
  const [startDate, setStartDate] = React.useState<string>(today);
  const [endDate, setEndDate] = React.useState<string>(today);
  const [customerName, setCustomerName] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");
  const [customerEmail, setCustomerEmail] = React.useState("");
  const [source, setSource] = React.useState<string>("walk_in");
  const [discount, setDiscount] = React.useState<string>("");
  const [notes, setNotes] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");

  const submit = async () => {
    setBusy(true); setErr("");
    try {
      if (!bikeId) throw new Error("Pick a bike.");
      if (!customerName.trim()) throw new Error("Customer name required.");
      await create({
        adminToken,
        bikeId: bikeId as Id<"bikes">,
        startDate, endDate,
        customerName: customerName.trim(),
        customerPhone: customerPhone || undefined,
        customerEmail: customerEmail || undefined,
        source,
        discount: discount ? parseFloat(discount) : undefined,
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
    <div style={{ padding: 16, border: "1px solid var(--line)", borderRadius: 12, background: "#fafafa" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <strong>New booking</strong>
        <button style={btnGhost} onClick={onClose}>Close</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
        <Field label="Bike">
          <select value={bikeId} onChange={(e) => setBikeId(e.target.value)} style={inputStyle}>
            <option value="">Pick…</option>
            {bikes.map((b: Doc<"bikes">) => (
              <option key={b._id} value={b._id}>{b.name} {b.color}</option>
            ))}
          </select>
        </Field>
        <Field label="Start"><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} /></Field>
        <Field label="End"><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} /></Field>
        <Field label="Customer name"><input value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={inputStyle} /></Field>
        <Field label="Phone (+CC)"><input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} style={inputStyle} placeholder="+50589..." /></Field>
        <Field label="Email"><input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} style={inputStyle} /></Field>
        <Field label="Source">
          <select value={source} onChange={(e) => setSource(e.target.value)} style={inputStyle}>
            {SOURCE_OPTIONS.map((s) => (<option key={s} value={s}>{s.replace("_", " ")}</option>))}
          </select>
        </Field>
        <Field label="Discount (USD)"><input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} style={inputStyle} /></Field>
        <Field label="Notes"><input value={notes} onChange={(e) => setNotes(e.target.value)} style={inputStyle} /></Field>
      </div>
      {err && <div style={{ color: "#b91c1c", fontSize: 12, marginTop: 8 }}>{err}</div>}
      <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button style={btnGhost} onClick={onClose}>Cancel</button>
        <button style={btnPrimary} disabled={busy} onClick={submit}>{busy ? "Saving…" : "Create booking"}</button>
      </div>
    </div>
  );
}

function EditBookingForm({
  reservationId, adminToken, onClose,
}: { reservationId: Id<"reservations">; adminToken: string; onClose: () => void }) {
  const all = useQuery(api.reservations.listForAdmin, {});
  const r = all?.find((x) => x._id === reservationId);
  const update = useMutation(api.reservations.adminUpdate);
  const [customerName, setCustomerName] = React.useState("");
  const [customerEmail, setCustomerEmail] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");
  const [source, setSource] = React.useState("");
  const [discount, setDiscount] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const initialised = React.useRef(false);

  React.useEffect(() => {
    if (!r || initialised.current) return;
    initialised.current = true;
    setCustomerName(`${r.docFirstName} ${r.docLastName}`.trim());
    setCustomerEmail(r.customerEmail ?? "");
    setCustomerPhone(`${r.phoneCC}${r.phoneNum}`);
    setSource(r.source ?? "");
    setDiscount(r.discount ? String(r.discount) : "");
    setNotes(r.notes ?? "");
    setStartDate(r.startDate);
    setEndDate(r.endDate);
  }, [r]);

  if (!r) return null;
  const submit = async () => {
    setBusy(true); setErr("");
    try {
      await update({
        adminToken, id: reservationId,
        customerName, customerEmail: customerEmail || undefined,
        customerPhone, source: source || undefined,
        discount: discount ? parseFloat(discount) : undefined,
        notes: notes || undefined,
        startDate, endDate,
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
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20,
    }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 20, maxWidth: 700, width: "100%", maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <strong>Edit booking {r.code}</strong>
          <button style={btnGhost} onClick={onClose}>Close</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          <Field label="Customer name"><input value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={inputStyle} /></Field>
          <Field label="Phone (+CC)"><input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} style={inputStyle} /></Field>
          <Field label="Email"><input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} style={inputStyle} /></Field>
          <Field label="Start"><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} /></Field>
          <Field label="End"><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} /></Field>
          <Field label="Source">
            <select value={source} onChange={(e) => setSource(e.target.value)} style={inputStyle}>
              <option value="">(none)</option>
              {SOURCE_OPTIONS.map((s) => (<option key={s} value={s}>{s.replace("_", " ")}</option>))}
            </select>
          </Field>
          <Field label="Discount (USD)"><input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} style={inputStyle} /></Field>
          <Field label="Notes"><input value={notes} onChange={(e) => setNotes(e.target.value)} style={inputStyle} /></Field>
        </div>
        {err && <div style={{ color: "#b91c1c", fontSize: 12, marginTop: 8 }}>{err}</div>}
        <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button style={btnGhost} onClick={onClose}>Cancel</button>
          <button style={btnPrimary} disabled={busy} onClick={submit}>{busy ? "Saving…" : "Save"}</button>
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
