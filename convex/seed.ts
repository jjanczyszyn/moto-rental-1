import { mutation } from "./_generated/server";

export const all = mutation({
  args: {},
  handler: async (ctx) => {
    // config — only zelle and bank transfers carry the legal beneficiary name
    // (those are the channels where it's needed for the recipient lookup).
    const paymentMethods = [
      { id: "cash", label: "Cash on delivery", sub: "USD or córdobas at hand-off", detail: ["Payment on delivery in USD or córdobas."], enabled: true },
      { id: "venmo", label: "Venmo", sub: "@justina-lydia", detail: ["Send to @justina-lydia."], enabled: true, url: "https://venmo.com/u/justina-lydia" },
      { id: "zelle", label: "Zelle", sub: "6469340781", detail: ["Phone: 646 934 0781", "Recipient: Justyna Janczyszyn"], enabled: true },
      { id: "paypal", label: "PayPal", sub: "justinalydiacuddles@gmail.com", detail: ["Email: justinalydiacuddles@gmail.com", "Friends & Family preferred (no fee)."], enabled: true, url: "mailto:justinalydiacuddles@gmail.com" },
      { id: "wise", label: "Wise", sub: "wise.com/pay/me/justynaj102", detail: ["Open the pay link to send via Wise."], enabled: true, url: "https://wise.com/pay/me/justynaj102" },
      { id: "revolut", label: "Revolut or debit/credit card", sub: "@justynshx", detail: ["Pay @justynshx via Revolut, or with any debit/credit card on the same link."], enabled: true, url: "https://revolut.me/justynshx" },
      { id: "transfer-usd", label: "Bank transfer · USD", sub: "US routing", detail: ["Beneficiary: Justyna Janczyszyn", "Routing: 026073150", "Account: 822000215918"], enabled: true },
      { id: "transfer-eur", label: "Bank transfer · EUR", sub: "IBAN (Belgium)", detail: ["Beneficiary: Justyna Janczyszyn", "IBAN: BE06 9671 9692 5322"], enabled: true },
    ];
    const cfg = await ctx.db.query("config").first();
    if (!cfg) {
      await ctx.db.insert("config", {
        dailyRate: 20,
        weeklyRate: 120,
        monthlyRate: 450,
        deliveryStart: 7,
        deliveryEnd: 20,
        deposit: 100,
        contractTerms: "",
        paymentMethods,
      });
    } else {
      // Re-apply payment methods on every seed run so edits propagate without
      // a manual DB patch.
      await ctx.db.patch(cfg._id, { paymentMethods });
    }

    // bikes
    const seedBikes = [
      { slug: "genesis-red", name: "Genesis KLIK", color: "Red", type: "Electric" as const, plate: "POP-217", range: "70 km range", image: "assets/genesis-red.png", isActive: true },
      { slug: "genesis-blue", name: "Genesis KLIK", color: "Blue", type: "Electric" as const, plate: "POP-184", range: "70 km range", image: "assets/genesis-blue.png", isActive: true },
      { slug: "yamaha-xt", name: "Yamaha XT 125", color: "White", type: "Gas" as const, plate: "POP-302", range: "125cc · 4-speed", image: "assets/yamaha-xt125.png", isActive: true },
    ];
    for (const b of seedBikes) {
      const existing = await ctx.db.query("bikes").withIndex("by_slug", (q) => q.eq("slug", b.slug)).first();
      if (!existing) await ctx.db.insert("bikes", b);
    }

    // reviews
    const seedReviews = [
      { googleId: "seed-1", name: "Marina S.", rating: 5, text: "Karen and JJ delivered the moto right to our hostel — surf rack already on, two helmets, full tank. The Genesis was perfect for the dirt roads to Playa Santana.", when: "2 weeks ago" },
      { googleId: "seed-2", name: "Tom R.", rating: 5, text: "Best moto experience in Popoyo. Brand-new electric, charged it once during a 4-day rental. Highly recommend.", when: "1 month ago" },
      { googleId: "seed-3", name: "Léa B.", rating: 5, text: "On honeymoon and these guys made it so easy. Picked us up from the hotel, contract on the phone, done in 10 minutes. The XT 125 handled Guasacate like a dream.", when: "3 weeks ago" },
      { googleId: "seed-4", name: "Diego A.", rating: 5, text: "Rented for 3 weeks and got a great monthly rate. Moto was spotless, helmets actually fit, and they came to swap a tire when I picked up a nail. Real local service.", when: "2 months ago" },
      { googleId: "seed-5", name: "Sophie K.", rating: 5, text: "I was nervous about renting in Nica but Karen walked me through everything. Surf rack fits a 6'2 longboard no problem. Five stars, will be back next dry season.", when: "5 days ago" },
      { googleId: "seed-6", name: "Jonas H.", rating: 5, text: "Quiet, fast, easy. The blue Genesis is silent on the dawn ride to Popoyo Outer Reef — felt like cheating. Fair pricing, zero drama.", when: "6 weeks ago" },
    ];
    const now = Date.now();
    for (const r of seedReviews) {
      const existing = await ctx.db.query("reviews").withIndex("by_googleId", (q) => q.eq("googleId", r.googleId)).first();
      if (!existing) await ctx.db.insert("reviews", { ...r, fetchedAt: now });
    }

    return "ok";
  },
});
