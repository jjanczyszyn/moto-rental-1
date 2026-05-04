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
      { id: "paypal", label: "PayPal", sub: "paypal.me/JustinaLydia", detail: ["Friends & Family preferred (no fee)."], enabled: true, url: "https://www.paypal.com/paypalme/JustinaLydia" },
      { id: "wise", label: "Wise", sub: "wise.com/pay/me/justynaj102", detail: ["Open the pay link to send via Wise."], enabled: true, url: "https://wise.com/pay/me/justynaj102" },
      { id: "revolut", label: "Revolut", sub: "@justynshx", detail: ["Send to @justynshx via Revolut."], enabled: true, url: "https://revolut.me/justynshx" },
      { id: "card", label: "Debit/credit card", sub: "Any Visa or Mastercard", detail: ["Pay with any debit or credit card on the hosted Revolut page — no account needed."], enabled: true, url: "https://revolut.me/justynshx" },
      { id: "applepay", label: "Apple Pay", sub: "One tap on iPhone", detail: ["Tap Apple Pay on the hosted Revolut page."], enabled: true, url: "https://revolut.me/justynshx" },
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
      { slug: "genesis-red", name: "Genesis KLIK", color: "Red", type: "Electric" as const, plate: "RI 50272", range: "70 km range", image: "assets/genesis-red.png", isActive: true },
      { slug: "genesis-blue", name: "Genesis KLIK", color: "Blue", type: "Electric" as const, plate: "RI 50273", range: "70 km range", image: "assets/genesis-blue.png", isActive: true },
      { slug: "yamaha-xt", name: "Yamaha XT 125", color: "White", type: "Gas" as const, plate: "RI 46495", range: "125cc · 4-speed", image: "assets/yamaha-xt125.png", isActive: true },
    ];
    for (const b of seedBikes) {
      const existing = await ctx.db.query("bikes").withIndex("by_slug", (q) => q.eq("slug", b.slug)).first();
      if (!existing) await ctx.db.insert("bikes", b);
    }

    // reviews
    // Real Google reviews (verbatim). Sort order in the carousel is by
     // fetchedAt desc — we set fetchedAt below per review so the most recent
     // ones surface first.
    const seedReviews = [
      { googleId: "g-sean",                       name: "Sean",                          rating: 5, text: "Good prices, convenient and timely drop off and pick up, great bike. Highly recommended. Thanks!", when: "4 days ago",   ageDays: 4 },
      { googleId: "g-leila-chan-currie",          name: "Leila Chan Currie",             rating: 5, text: "Super smooth and easy rental! Very happy with the moto I got, and the people were really sweet and helpful. A few of my friends also rented and had no issues either. Go for it!", when: "6 days ago",   ageDays: 6 },
      { googleId: "g-paul-mala",                  name: "Paul MALA",                     rating: 5, text: "Great experience! The owners are accommodating and the vehicles are of excellent quality!", when: "2 months ago",  ageDays: 60 },
      { googleId: "g-corentin-francois",          name: "Corentin FRANCOIS",             rating: 5, text: "Super responsive and accommodating, quality motorcycles. A big thank you for the recommendations and good advice, I highly recommend them!", when: "2 months ago",  ageDays: 62 },
      { googleId: "g-joao-pedro-correa",          name: "João Pedro Corrêa dos Santos",  rating: 5, text: "Impeccable service and the motorcycle is also in excellent condition. They deliver the motorcycle to your accommodation with a full tank. Always attentive to anything you need.", when: "2 months ago",  ageDays: 64 },
      { googleId: "g-jana-schilling",             name: "Jana Schilling",                rating: 5, text: "Highly recommend Karen's Moto Rental. Smooth process, excellent bike, and very kind people. They delivered the bike on time, came back for any adjustment I needed & were super helpful. One of the best rental experiences I've had. Thank you Karen & Dani!!", when: "3 months ago", ageDays: 90 },
      { googleId: "g-melanie-velasquez-gallo",    name: "Melanie Velasquez Gallo",       rating: 5, text: "JJ and Karen are wonderful. They rented us their motorcycle, which was brand new and ran perfectly. Besides the excellent rental service, they took us to the bus stop and recommended a friend who could pick us up in Managua.", when: "5 months ago", ageDays: 150 },
      { googleId: "g-katherinevanessa-tovalvega", name: "Katherinevanessa Tovalvega",    rating: 5, text: "The best rentals in Popoyo! Quality service. Highly recommend 😀😀", when: "8 months ago",      ageDays: 240 },
      { googleId: "g-rotem-leibovitz",            name: "רותם ליבוביץ",                  rating: 5, text: "Dani is amazing guy, loyal and friendly! He helped me many times and his service was so good and nice! I am highly recommending to rent from Dani!", when: "9 months ago", ageDays: 270 },
      { googleId: "g-guillaume-gelderblom",       name: "Guillaume Gelderblom",          rating: 5, text: "Good scooters, easy to ride, good communication with Karen. Was great and fun to travel around Popoyo. Muchas Gracias.", when: "9 months ago",  ageDays: 271 },
      { googleId: "g-deric-cheng",                name: "Deric Cheng",                   rating: 5, text: "These motos were high quality, reliable, and the team was extremely responsive whenever I had any issues ☺️ Would strongly recommend!", when: "9 months ago",  ageDays: 272 },
      { googleId: "g-lou-nkpa",                   name: "Lou Nkpa",                      rating: 5, text: "Great experience with them. It's a local family business with very reasonable prices and great service!", when: "9 months ago",  ageDays: 273 },
      { googleId: "g-animatronik-eventos",        name: "Animatronik Eventos",           rating: 5, text: "Impeccable service. They delivered my motorcycle and picked it up from Hacienda Iguana immediately and at no extra cost.", when: "9 months ago",  ageDays: 274 },
      { googleId: "g-harel-elyakim",              name: "הראל אליקים",                   rating: 5, text: "Highest level of service available. Highly recommended!", when: "9 months ago",  ageDays: 275 },
      { googleId: "g-yuval-elboim",               name: "יובל אלבוים",                   rating: 5, text: "Excellent bikes, good owners, highly recommended", when: "9 months ago",  ageDays: 276 },
      { googleId: "g-roei-taieb",                 name: "Roei Taieb",                    rating: 5, text: "Perfect, the best motorcycle for Popoyo 🙌", when: "9 months ago",  ageDays: 277 },
    ];
    const NOW = Date.now();
    const wantedIds = new Set(seedReviews.map((r) => r.googleId));

    // Wipe any existing reviews that aren't in the canonical list (clears
    // the old fake "seed-N" entries and lets us re-run safely).
    const existingAll = await ctx.db.query("reviews").collect();
    for (const r of existingAll) {
      if (!wantedIds.has(r.googleId)) await ctx.db.delete(r._id);
    }

    for (const r of seedReviews) {
      const { ageDays, ...row } = r;
      const fetchedAt = NOW - ageDays * 86400000;
      const existing = await ctx.db
        .query("reviews")
        .withIndex("by_googleId", (q) => q.eq("googleId", r.googleId))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, { ...row, fetchedAt });
      } else {
        await ctx.db.insert("reviews", { ...row, fetchedAt });
      }
    }

    return "ok";
  },
});
