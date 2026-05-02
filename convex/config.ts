import { query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

// The config row is always present after `seed:all` runs at deploy time.
// Returning `null` is safe — every consumer already uses optional chaining
// while the query is loading.
export const get = query({
  args: {},
  handler: async (ctx): Promise<Doc<"config"> | null> => {
    return await ctx.db.query("config").first();
  },
});
