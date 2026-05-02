import React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

const PASSWORDS = ["Karen-esta-Fuert3", "JJ-is-f0rmidable"];
const STORAGE_KEY = "kj-admin-auth";

function useAdminAuth() {
  const [authed, setAuthed] = React.useState(() => sessionStorage.getItem(STORAGE_KEY) === "1");
  const tryPassword = (pw: string) => {
    if (PASSWORDS.includes(pw)) {
      sessionStorage.setItem(STORAGE_KEY, "1");
      setAuthed(true);
      return true;
    }
    return false;
  };
  const logout = () => { sessionStorage.removeItem(STORAGE_KEY); setAuthed(false); };
  return { authed, tryPassword, logout };
}

function LoginGate({ onSubmit }: { onSubmit: (pw: string) => boolean }) {
  const [pw, setPw] = React.useState("");
  const [err, setErr] = React.useState(false);
  return (
    <div style={{ maxWidth: 360, margin: "100px auto", padding: 24, border: "1px solid var(--line)", borderRadius: 16 }}>
      <h2 style={{ margin: "0 0 12px", fontSize: 22 }}>Admin login</h2>
      <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 0 }}>Enter the owner password.</p>
      <form onSubmit={(e) => { e.preventDefault(); if (!onSubmit(pw)) setErr(true); }}>
        <input
          type="password"
          value={pw}
          onChange={(e) => { setPw(e.target.value); setErr(false); }}
          autoFocus
          placeholder="Password"
          style={{
            width: "100%", padding: "12px 14px", borderRadius: 10,
            border: `1px solid ${err ? "#dc2626" : "var(--line)"}`,
            fontSize: 14, marginBottom: 12, outline: "none",
          }}
        />
        {err && <div style={{ color: "#dc2626", fontSize: 12, marginBottom: 12 }}>Wrong password.</div>}
        <button type="submit" style={{
          width: "100%", padding: 12, borderRadius: 10, border: "none",
          background: "var(--ink)", color: "#fff", fontSize: 14, fontWeight: 600,
        }}>Sign in</button>
      </form>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, [string, string]> = {
    pending: ["#fef3c7", "#92400e"],
    confirmed: ["#d1fae5", "#065f46"],
    active: ["#dbeafe", "#1e3a8a"],
    returned: ["#f3f4f6", "#374151"],
    cancelled: ["#fee2e2", "#991b1b"],
  };
  const [bg, fg] = colors[status] ?? ["#f3f4f6", "#374151"];
  return (
    <span style={{
      padding: "2px 8px", borderRadius: 999, background: bg, color: fg,
      fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5,
    }}>{status}</span>
  );
}

function ReservationsTable() {
  const reservations = useQuery(api.reservations.list, {}) ?? [];
  const setStatus = useMutation(api.reservations.setStatus);

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const today = new Date(); today.setHours(0,0,0,0);

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Reservations ({reservations.length})</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {reservations.map((r) => (
          <div key={r._id} style={{ padding: 12, border: "1px solid var(--line)", borderRadius: 12, background: "#fff", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: "0 0 auto" }}><StatusPill status={r.status} /></div>
            <div style={{ flex: "1 1 200px" }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {r.docFirstName} {r.docLastName}
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "var(--muted)", marginLeft: 8 }}>{r.code}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                {fmtDate(r.startDate)} → {fmtDate(r.endDate)} · {r.days}d · ${r.totalUSD} · {r.phoneCC} {r.phoneNum}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                {r.deliveryAddr || "—"} @ {r.deliveryHour}h
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {r.status === "pending" && (
                <button onClick={() => setStatus({ id: r._id, status: "confirmed" })} style={btnPrimary}>Confirm</button>
              )}
              {r.status === "confirmed" && (
                <button onClick={() => setStatus({ id: r._id, status: "active" })} style={btnPrimary}>Mark delivered</button>
              )}
              {r.status === "active" && (
                <button onClick={() => setStatus({ id: r._id, status: "returned" })} style={btnPrimary}>Mark returned</button>
              )}
              {r.status !== "cancelled" && r.status !== "returned" && (
                <button onClick={() => setStatus({ id: r._id, status: "cancelled" })} style={btnGhost}>Cancel</button>
              )}
            </div>
          </div>
        ))}
        {reservations.length === 0 && <div style={{ color: "var(--muted)", fontSize: 13 }}>No reservations yet.</div>}
      </div>
    </div>
  );
}

function BikesPanel() {
  const bikes = useQuery(api.bikes.list) ?? [];
  const setActive = useMutation(api.bikes.setActive);
  return (
    <div>
      <h3>Fleet</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {bikes.map((b) => (
          <div key={b._id} style={{ padding: 12, border: "1px solid var(--line)", borderRadius: 12 }}>
            <div style={{ fontWeight: 600 }}>{b.name} · {b.color}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{b.plate} · {b.range}</div>
            <label style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={b.isActive}
                onChange={(e) => setActive({ bikeId: b._id as Id<"bikes">, isActive: e.target.checked })}
              />
              Active
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  padding: "6px 10px", borderRadius: 8, border: "none",
  background: "var(--ink)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
};
const btnGhost: React.CSSProperties = {
  padding: "6px 10px", borderRadius: 8, border: "1px solid var(--line)",
  background: "#fff", color: "var(--ink)", fontSize: 12, fontWeight: 600, cursor: "pointer",
};

export function AdminScreen() {
  const { authed, tryPassword, logout } = useAdminAuth();
  if (!authed) return <LoginGate onSubmit={tryPassword} />;
  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "24px 20px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>Karen & JJ — Admin</h1>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>v1 owner dashboard</div>
        </div>
        <button onClick={logout} style={btnGhost}>Sign out</button>
      </header>
      <div style={{ display: "grid", gap: 32 }}>
        <ReservationsTable />
        <BikesPanel />
      </div>
    </div>
  );
}
