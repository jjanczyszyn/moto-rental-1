import React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import {
  StatusPill, fmtUSD, fmtDate, fmtDateShort, btnPrimary, btnGhost, inputStyle,
  labelStyle, tableWrap, tableStyle, thStyle, tdStyle, RESERVATION_STATUSES,
  SOURCE_OPTIONS, isoToday, ConfirmButton, useIsMobile, mobileCard, mobileLabel,
  mobileValue,
} from "./shared";
import { RecordPaymentModal, PaymentStatusEditor, EditPaymentModal } from "./Payments";
import type { Doc as ConvexDoc } from "../../convex/_generated/dataModel";

interface Props { adminToken: string; }

export function Bookings({ adminToken }: Props) {
  const [statusFilter, setStatusFilter] = React.useState<string>("");
  const [sourceFilter, setSourceFilter] = React.useState<string>("");
  const [showNew, setShowNew] = React.useState(false);
  const [editing, setEditing] = React.useState<Id<"reservations"> | null>(null);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  const toggleExpanded = (id: Id<"reservations">) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Cancelled bookings clutter the working view. Default the toggle on so
  // the manager only sees bookings that still matter; flip off to audit
  // everything (and the explicit status="cancelled" filter still works).
  const [hideCancelled, setHideCancelled] = React.useState(true);

  const rawBookings = useQuery(
    api.reservations.listForAdmin,
    {
      status: statusFilter || undefined,
      source: sourceFilter || undefined,
    }
  );
  const bookings = React.useMemo(() => {
    if (!rawBookings) return rawBookings;
    if (!hideCancelled) return rawBookings;
    if (statusFilter === "cancelled") return rawBookings; // user asked for them
    return rawBookings.filter((r) => r.status !== "cancelled");
  }, [rawBookings, hideCancelled, statusFilter]);
  const cancelledHidden = (rawBookings?.length ?? 0) - (bookings?.length ?? 0);

  const setStatus = useMutation(api.reservations.setStatus);
  const mobile = useIsMobile();

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
        <button
          type="button"
          onClick={() => setHideCancelled((v) => !v)}
          aria-pressed={hideCancelled}
          title={hideCancelled ? "Click to show cancelled bookings" : "Click to hide cancelled bookings"}
          style={{
            ...(hideCancelled ? btnPrimary : btnGhost),
            display: "inline-flex", alignItems: "center", gap: 6,
          }}
        >
          {hideCancelled ? "✓ " : ""}Hide cancelled
          {hideCancelled && cancelledHidden > 0 && (
            <span style={{ opacity: 0.7, fontSize: 11 }}>({cancelledHidden})</span>
          )}
        </button>
        <button style={{ ...btnPrimary, marginLeft: "auto" }} onClick={() => setShowNew(true)}>+ New booking</button>
      </header>

      {showNew && (
        <NewBookingForm
          adminToken={adminToken}
          onClose={() => setShowNew(false)}
        />
      )}

      {mobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(bookings ?? []).map((r) => {
            const isOpen = expanded.has(r._id);
            return (
              <div key={r._id} style={mobileCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{r.docFirstName} {r.docLastName}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "JetBrains Mono, monospace" }}>{r.code}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <StatusPill status={r.status} />
                    <StatusPill status={r.payStatus} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <div style={mobileLabel}>Bike</div>
                    <div style={mobileValue}>{r.bike ? `${r.bike.name} ${r.bike.color}` : "—"}</div>
                  </div>
                  <div>
                    <div style={mobileLabel}>Dates</div>
                    <div style={mobileValue}>{fmtDateShort(r.startDate)} → {fmtDateShort(r.endDate)}</div>
                  </div>
                  <div>
                    <div style={mobileLabel}>Total</div>
                    <div style={mobileValue}>{fmtUSD(r.totalUSD)} <span style={{ color: "var(--muted)", fontSize: 11 }}>· {r.days}d</span></div>
                  </div>
                  <div>
                    <div style={mobileLabel}>Paid</div>
                    <div style={mobileValue}>{fmtUSD(r.paid)}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <select
                    value={r.status}
                    onChange={(e) => setStatus({ id: r._id, status: e.target.value as any, adminToken })}
                    style={{ ...inputStyle, fontSize: 12, padding: "6px 8px", flex: 1, minWidth: 110 }}
                  >
                    {RESERVATION_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
                  </select>
                  <button style={btnGhost} onClick={() => setEditing(r._id)}>Edit</button>
                  <button style={btnGhost} onClick={() => toggleExpanded(r._id)}>
                    {isOpen ? "Hide payments" : "Payments"}
                  </button>
                </div>
                {isOpen && (
                  <div style={{ marginTop: 4, paddingTop: 10, borderTop: "1px solid var(--line-2)" }}>
                    <BookingPaymentsPanel reservationId={r._id} adminToken={adminToken} />
                  </div>
                )}
              </div>
            );
          })}
          {bookings && bookings.length === 0 && (
            <div style={{ ...mobileCard, textAlign: "center", color: "var(--muted)" }}>
              No bookings match these filters.
            </div>
          )}
        </div>
      ) : (
      <div style={tableWrap}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 32 }}></th>
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
            {(bookings ?? []).map((r) => {
              const isOpen = expanded.has(r._id);
              return (
                <React.Fragment key={r._id}>
                  <tr>
                    <td
                      style={{ ...tdStyle, cursor: "pointer", userSelect: "none", color: "var(--muted)", textAlign: "center" }}
                      onClick={() => toggleExpanded(r._id)}
                      title={isOpen ? "Hide payments" : "Show payments"}
                    >
                      {isOpen ? "▾" : "▸"}
                    </td>
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
                    <td style={tdStyle}>
                      <span style={{ cursor: "pointer" }} onClick={() => toggleExpanded(r._id)} title="Show payments">
                        <StatusPill status={r.payStatus} />
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textTransform: "capitalize" }}>{(r.source ?? "—").replace("_", " ")}</td>
                    <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button style={btnGhost} onClick={() => setEditing(r._id)}>Edit</button>
                        <StatusActions r={r} onChange={(s) => setStatus({ id: r._id, status: s, adminToken })} />
                      </div>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={12} style={{ padding: 0, background: "#fafafa", borderBottom: "1px solid var(--line-2)" }}>
                        <div style={{ padding: "12px 16px" }}>
                          <BookingPaymentsPanel reservationId={r._id} adminToken={adminToken} />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {bookings && bookings.length === 0 && (
              <tr>
                <td colSpan={12} style={{ ...tdStyle, textAlign: "center", color: "var(--muted)", padding: 24 }}>
                  No bookings match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}

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
          <button style={btnPrimary} disabled={busy} onClick={submit}>{busy ? "Saving…" : "Save booking"}</button>
        </div>

        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
          <BookingPaymentsPanel reservationId={reservationId} adminToken={adminToken} />
        </div>
      </div>
    </div>
  );
}

// Inline payments panel reused inside the booking-edit modal AND under each
// booking row in the main table. Lists existing payments, lets the manager
// flip status (and other fields via the deletion + re-record path), and
// gives one-click access to the record-payment modal scoped to this booking.
export function BookingPaymentsPanel({
  reservationId, adminToken,
}: { reservationId: Id<"reservations">; adminToken: string }) {
  const payments = useQuery(api.payments.listForReservation, { reservationId });
  const removePayment = useMutation(api.payments.remove);
  const updatePayment = useMutation(api.payments.update);
  const [recording, setRecording] = React.useState(false);
  const [editing, setEditing] = React.useState<ConvexDoc<"payments"> | null>(null);
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <strong>Payments ({payments?.length ?? 0})</strong>
        <button style={btnPrimary} onClick={() => setRecording(true)}>+ Record payment</button>
      </div>
      {payments && payments.length === 0 && (
        <div style={{ fontSize: 13, color: "var(--muted)" }}>No payments recorded for this booking yet.</div>
      )}
      {payments && payments.length > 0 && (
        <div style={tableWrap}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Received</th>
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
              {payments.map((p) => (
                <tr key={p._id}>
                  <td style={tdStyle}>{p.receivedAt ? fmtDate(new Date(p.receivedAt).toISOString()) : "—"}</td>
                  <td style={tdStyle}>{p.method}</td>
                  <td style={tdStyle}><StatusPill status={p.paymentType} /></td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>{fmtUSD(p.amount)}</td>
                  <td style={tdStyle}>{p.collectedBy}</td>
                  <td style={tdStyle}>
                    <PaymentStatusEditor
                      payment={p}
                      onChange={(status) => updatePayment({ adminToken, paymentId: p._id, status })}
                    />
                  </td>
                  <td style={{ ...tdStyle, fontSize: 12, color: "var(--muted)" }}>{p.notes ?? ""}</td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button style={btnGhost} onClick={() => setEditing(p)}>Edit</button>
                      <ConfirmButton label="Delete" confirmLabel="Sure?" onConfirm={() => removePayment({ adminToken, paymentId: p._id })} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {recording && (
        <RecordPaymentModal
          reservationId={reservationId}
          adminToken={adminToken}
          onClose={() => setRecording(false)}
        />
      )}
      {editing && (
        <EditPaymentModal
          payment={editing}
          adminToken={adminToken}
          onClose={() => setEditing(null)}
        />
      )}
    </>
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
