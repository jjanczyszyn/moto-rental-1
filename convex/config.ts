import { query, mutation } from "./_generated/server";

const DEFAULTS = {
  dailyRate: 20,
  weeklyRate: 120,
  monthlyRate: 450,
  deliveryStart: 7,
  deliveryEnd: 20,
  deposit: 100,
  contractTerms: "",
  paymentMethods: [
    { id: "cash", label: "Cash on delivery", sub: "USD or córdobas at hand-off", detail: ["Pay Karen or JJ in USD or córdobas when we deliver the moto."], enabled: true },
    { id: "venmo", label: "Venmo", sub: "@justina-lydia", detail: ["Send to @justina-lydia (Justyna Janczyszyn)."], enabled: true },
    { id: "zelle", label: "Zelle", sub: "6469340781", detail: ["Phone: 646 934 0781", "Recipient: Justyna Janczyszyn"], enabled: true },
    { id: "paypal", label: "PayPal", sub: "justinalydiacuddles@gmail.com", detail: ["Email: justinalydiacuddles@gmail.com", "Friends & Family preferred (no fee)."], enabled: true },
    { id: "wise", label: "Wise", sub: "wise.com/pay/me/justynaj102", detail: ["Pay link: wise.com/pay/me/justynaj102"], enabled: true },
    { id: "revolut", label: "Revolut", sub: "@justynshx", detail: ["Send to @justynshx (Justyna Janczyszyn)."], enabled: true },
    { id: "transfer-usd", label: "Bank transfer · USD", sub: "US routing", detail: ["Beneficiary: Justyna Janczyszyn", "Routing: 026073150", "Account: 822000215918"], enabled: true },
    { id: "transfer-eur", label: "Bank transfer · EUR", sub: "IBAN (Belgium)", detail: ["Beneficiary: Justyna Janczyszyn", "IBAN: BE06 9671 9692 5322"], enabled: true },
  ],
};

export const get = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db.query("config").first();
    if (row) return row;
    // Return defaults for the very first read (before seed has run).
    return { _id: null, _creationTime: Date.now(), ...DEFAULTS };
  },
});

export const ensureSeeded = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("config").first();
    if (existing) return existing._id;
    return await ctx.db.insert("config", DEFAULTS);
  },
});
