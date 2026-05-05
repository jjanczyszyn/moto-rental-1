import { v } from "convex/values";
import { mutation, query, MutationCtx } from "./_generated/server";

// Server-side admin auth. The password allowlist lives in the
// ADMIN_PASSWORDS Convex env var (comma-separated). Verifying a password
// returns a random session token that's stored in the adminSessions table
// and required by every admin-only mutation. The client never sees the
// password material — it only exists in the Convex deployment env.

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function loadAllowed(): string[] {
  const raw = process.env.ADMIN_PASSWORDS ?? "";
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function randomToken(): string {
  // 32 hex chars from two random doubles. Doesn't need to be cryptographically
  // perfect — only used to gate a small admin panel and tied to a 24h TTL.
  const a = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, "0");
  const b = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, "0");
  const c = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, "0");
  const d = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, "0");
  return `${a}${b}${c}${d}`;
}

export const verifyPassword = mutation({
  args: { password: v.string() },
  handler: async (ctx, { password }) => {
    const allowed = loadAllowed();
    if (allowed.length === 0) {
      throw new Error("Admin login is not configured (ADMIN_PASSWORDS env var unset).");
    }
    if (!allowed.includes(password)) {
      // Generic message — don't leak whether the env var is set.
      throw new Error("Invalid password.");
    }
    const token = randomToken();
    await ctx.db.insert("adminSessions", {
      token,
      expiresAt: Date.now() + SESSION_TTL_MS,
    });
    // Opportunistically clean up expired sessions so the table doesn't grow
    // forever — cheap on a tiny admin table.
    const stale = await ctx.db.query("adminSessions").collect();
    for (const s of stale) {
      if (s.expiresAt < Date.now()) await ctx.db.delete(s._id);
    }
    return { token, expiresAt: Date.now() + SESSION_TTL_MS };
  },
});

export const checkSession = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const row = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();
    if (!row) return { ok: false };
    if (row.expiresAt < Date.now()) return { ok: false };
    return { ok: true, expiresAt: row.expiresAt };
  },
});

export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const row = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();
    if (row) await ctx.db.delete(row._id);
  },
});

// Helper for admin mutations elsewhere in convex/. Throws if the token is
// missing or expired. Returns the session row otherwise.
export async function assertAdmin(ctx: MutationCtx, token: string) {
  if (!token) throw new Error("Admin auth required.");
  const row = await ctx.db
    .query("adminSessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();
  if (!row) throw new Error("Admin auth required.");
  if (row.expiresAt < Date.now()) {
    await ctx.db.delete(row._id);
    throw new Error("Admin session expired — please sign in again.");
  }
  return row;
}
