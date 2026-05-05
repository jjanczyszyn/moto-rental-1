import React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Dashboard } from "../admin/Dashboard";
import { Bookings } from "../admin/Bookings";
import { Motorcycles } from "../admin/Motorcycles";
import { Revenue } from "../admin/Revenue";
import { Payments } from "../admin/Payments";
import { Seasonality } from "../admin/Seasonality";
import { Settlement } from "../admin/Settlement";
import { Reports } from "../admin/Reports";
import { Settings } from "../admin/Settings";
import { SectionErrorBoundary } from "../admin/shared";

// Server-side auth: each owner has their own password env var
// (ADMIN_KAREN_PASSWORD / ADMIN_JJ_PASSWORD). Login submits the typed
// username + password pair; verifyPassword returns a session token that's
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
  return { authed, token, tryPassword, logout, session };
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
        Enter your owner credentials.
      </p>
      <form onSubmit={async (e) => {
        e.preventDefault();
        const u = usernameRaw.trim().toLowerCase();
        if (!u) return;
        setBusy(true); setErr(null);
        sessionStorage.setItem("kj-admin-user", u);
        const ok = await onSubmit(u as "karen" | "jj", pw);
        setBusy(false);
        // Generic message — never reveal whether the username or password was
        // the wrong half. Only owners know which usernames are valid.
        if (!ok) setErr("Invalid credentials.");
      }}>
        <div style={labelStyle}>Username</div>
        <input
          type="text"
          value={usernameRaw}
          onChange={(e) => { setUsernameRaw(e.target.value); setErr(null); }}
          autoFocus
          placeholder="Username"
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
        {/* Server already returns a generic "Invalid username or password."
            so the response status doesn't leak which half was wrong either. */}
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

const TABS = [
  "dashboard", "bookings", "motorcycles", "revenue", "payments",
  "seasonality", "settlement", "reports", "settings",
] as const;
type Tab = typeof TABS[number];

const TAB_LABELS: Record<Tab, string> = {
  dashboard: "Dashboard",
  bookings: "Bookings",
  motorcycles: "Motorcycles",
  revenue: "Revenue",
  payments: "Payments",
  seasonality: "Seasonality",
  settlement: "Partner settlement",
  reports: "Reports",
  settings: "Settings",
};

export function AdminScreen() {
  const { authed, token, tryPassword, logout, session } = useAdminAuth();
  const [tab, setTab] = React.useState<Tab>(() => {
    const fromHash = window.location.hash.replace(/^#/, "");
    return (TABS as readonly string[]).includes(fromHash) ? (fromHash as Tab) : "dashboard";
  });

  React.useEffect(() => {
    if (tab) window.location.hash = tab;
  }, [tab]);

  const today = new Date();
  const [year, setYear] = React.useState(today.getFullYear());
  const [monthIdx0, setMonthIdx0] = React.useState(today.getMonth());

  if (!authed || !token) return <LoginGate onSubmit={tryPassword} />;

  const sectionProps = { year, monthIdx0, setYear, setMonth: setMonthIdx0 };
  let inner: React.ReactNode;
  switch (tab) {
    case "dashboard":   inner = <Dashboard {...sectionProps} />; break;
    case "bookings":    inner = <Bookings adminToken={token} />; break;
    case "motorcycles": inner = <Motorcycles adminToken={token} />; break;
    case "revenue":     inner = <Revenue year={year} setYear={setYear} />; break;
    case "payments":    inner = <Payments adminToken={token} {...sectionProps} />; break;
    case "seasonality": inner = <Seasonality year={year} setYear={setYear} />; break;
    case "settlement":  inner = <Settlement adminToken={token} {...sectionProps} />; break;
    case "reports":     inner = <Reports year={year} setYear={setYear} />; break;
    case "settings":    inner = <Settings adminToken={token} />; break;
  }
  // `key={tab}` resets the boundary each time the user switches tabs so a
  // recovered error on one tab doesn't carry over to the next.
  const body = (
    <SectionErrorBoundary key={tab} sectionName={TAB_LABELS[tab]}>
      {inner}
    </SectionErrorBoundary>
  );

  const username = (session && session.ok && session.username) ? session.username : null;

  return (
    <div style={{ minHeight: "100dvh", background: "#fafafa", paddingBottom: 60 }}>
      <header style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 24px", borderBottom: "1px solid var(--line)",
        background: "#fff", flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Karen & JJ Admin</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Business cockpit</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {username && (
            <span style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Signed in as <strong style={{ color: "var(--ink)" }}>{username}</strong>
            </span>
          )}
          <button onClick={logout} style={{
            padding: "8px 12px", borderRadius: 8, border: "1px solid var(--line)",
            background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>Sign out</button>
        </div>
      </header>
      <nav style={{
        display: "flex", gap: 4, padding: "8px 24px",
        borderBottom: "1px solid var(--line)", background: "#fff",
        overflowX: "auto", whiteSpace: "nowrap",
      }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 14px", borderRadius: 8, border: "none",
              background: tab === t ? "var(--ink)" : "transparent",
              color: tab === t ? "#fff" : "var(--ink-2)",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </nav>
      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 20px" }}>
        {body}
      </main>
    </div>
  );
}
