import React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// Server-side auth: the password allowlist lives in the ADMIN_PASSWORDS
// Convex env var, never in the client bundle. We submit the typed password
// to admin.verifyPassword which returns a session token; that token is then
// required by every admin-only mutation.
const TOKEN_KEY = "kj-admin-token";

function useAdminAuth() {
  const [token, setToken] = React.useState<string | null>(() =>
    sessionStorage.getItem(TOKEN_KEY)
  );
  const session = useQuery(api.admin.checkSession, token ? { token } : "skip");
  const verifyPassword = useMutation(api.admin.verifyPassword);
  const logoutMutation = useMutation(api.admin.logout);

  // If the server reports the session is no longer valid (expired, deleted),
  // drop our cached token so the login gate shows again.
  React.useEffect(() => {
    if (token && session && !session.ok) {
      sessionStorage.removeItem(TOKEN_KEY);
      setToken(null);
    }
  }, [token, session]);

  const tryPassword = async (
    username: "karen" | "jj",
    pw: string
  ): Promise<boolean> => {
    try {
      const result = await verifyPassword({ username, password: pw });
      sessionStorage.setItem(TOKEN_KEY, result.token);
      setToken(result.token);
      return true;
    } catch {
      return false;
    }
  };
  const logout = async () => {
    if (token) await logoutMutation({ token }).catch(() => {});
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
  };
  // Authed iff we have a token AND the latest server check confirms it (or
  // is still loading — useQuery returns undefined while in-flight, treat as
  // optimistic-allowed so the panel doesn't flash on every page load).
  const authed = !!token && (session === undefined || session.ok);
  return { authed, token, tryPassword, logout };
}

function LoginGate({
  onSubmit,
}: {
  onSubmit: (username: "karen" | "jj", pw: string) => Promise<boolean>;
}) {
  const [usernameRaw, setUsernameRaw] = React.useState<string>(() =>
    sessionStorage.getItem("kj-admin-user") ?? ""
  );
  const [pw, setPw] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const labelStyle: React.CSSProperties = {
    fontSize: 11, color: "var(--muted)", letterSpacing: 0.6,
    textTransform: "uppercase", fontWeight: 600, marginBottom: 6,
  };
  const inputStyle = (hasErr: boolean): React.CSSProperties => ({
    width: "100%", padding: "12px 14px", borderRadius: 10,
    border: `1px solid ${hasErr ? "#dc2626" : "var(--line)"}`,
    fontSize: 14, marginBottom: 12, outline: "none", boxSizing: "border-box",
  });

  return (
    <div style={{ maxWidth: 360, margin: "100px auto", padding: 24, border: "1px solid var(--line)", borderRadius: 16 }}>
      <h2 style={{ margin: "0 0 12px", fontSize: 22 }}>Admin login</h2>
      <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 0 }}>
        Enter your username (karen or jj) and password.
      </p>
      <form onSubmit={async (e) => {
        e.preventDefault();
        const u = usernameRaw.trim().toLowerCase();
        if (u !== "karen" && u !== "jj") {
          setErr("Username must be 'karen' or 'jj'.");
          return;
        }
        setBusy(true); setErr(null);
        sessionStorage.setItem("kj-admin-user", u);
        const ok = await onSubmit(u, pw);
        setBusy(false);
        if (!ok) setErr("Wrong username or password.");
      }}>
        <div style={labelStyle}>Username</div>
        <input
          type="text"
          value={usernameRaw}
          onChange={(e) => { setUsernameRaw(e.target.value); setErr(null); }}
          autoFocus
          placeholder="karen or jj"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          style={inputStyle(!!err)}
        />
        <div style={labelStyle}>Password</div>
        <input
          type="password"
          value={pw}
          onChange={(e) => { setPw(e.target.value); setErr(null); }}
          placeholder="Password"
          autoComplete="current-password"
          style={inputStyle(!!err)}
        />
        {err && <div style={{ color: "#dc2626", fontSize: 12, marginBottom: 12 }}>{err}</div>}
        <button type="submit" disabled={busy || !pw || !usernameRaw.trim()} style={{
          width: "100%", padding: 12, borderRadius: 10, border: "none",
          background: "var(--ink)", color: "#fff", fontSize: 14, fontWeight: 600,
          opacity: (busy || !pw || !usernameRaw.trim()) ? 0.6 : 1,
          cursor: (busy || !pw || !usernameRaw.trim()) ? "default" : "pointer",
        }}>{busy ? "Signing in…" : "Sign in"}</button>
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

function ReservationsTable({ adminToken }: { adminToken: string }) {
  const reservations = useQuery(api.reservations.list, {}) ?? [];
  const setStatus = useMutation(api.reservations.setStatus);

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

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
                <button onClick={() => setStatus({ id: r._id, status: "confirmed", adminToken })} style={btnPrimary}>Confirm</button>
              )}
              {r.status === "confirmed" && (
                <button onClick={() => setStatus({ id: r._id, status: "active", adminToken })} style={btnPrimary}>Mark delivered</button>
              )}
              {r.status === "active" && (
                <button onClick={() => setStatus({ id: r._id, status: "returned", adminToken })} style={btnPrimary}>Mark returned</button>
              )}
              {r.status !== "cancelled" && r.status !== "returned" && (
                <button onClick={() => setStatus({ id: r._id, status: "cancelled", adminToken })} style={btnGhost}>Cancel</button>
              )}
            </div>
          </div>
        ))}
        {reservations.length === 0 && <div style={{ color: "var(--muted)", fontSize: 13 }}>No reservations yet.</div>}
      </div>
    </div>
  );
}

function BikesPanel({ adminToken }: { adminToken: string }) {
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
                onChange={(e) => setActive({ bikeId: b._id as Id<"bikes">, isActive: e.target.checked, adminToken })}
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
  const { authed, token, tryPassword, logout } = useAdminAuth();
  if (!authed || !token) return <LoginGate onSubmit={tryPassword} />;
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
        <ReservationsTable adminToken={token} />
        <BikesPanel adminToken={token} />
      </div>
    </div>
  );
}
