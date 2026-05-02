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
      { googleId: "seed-1",  name: "Marina S.",  rating: 5, text: "Karen and JJ delivered the moto right to our hostel — surf rack already on, two helmets, full tank. The Genesis was perfect for the dirt roads to Playa Santana.", when: "2 weeks ago" },
      { googleId: "seed-2",  name: "Tom R.",     rating: 5, text: "Best moto experience in Popoyo. Brand-new electric, charged it once during a 4-day rental. Highly recommend.", when: "1 month ago" },
      { googleId: "seed-3",  name: "Léa B.",     rating: 5, text: "On honeymoon and these guys made it so easy. Picked us up from the hotel, contract on the phone, done in 10 minutes. The XT 125 handled Guasacate like a dream.", when: "3 weeks ago" },
      { googleId: "seed-4",  name: "Diego A.",   rating: 5, text: "Rented for 3 weeks and got a great monthly rate. Moto was spotless, helmets actually fit, and they came to swap a tire when I picked up a nail. Real local service.", when: "2 months ago" },
      { googleId: "seed-5",  name: "Sophie K.",  rating: 5, text: "I was nervous about renting in Nica but Karen walked me through everything. Surf rack fits a 6'2 longboard no problem. Five stars, will be back next dry season.", when: "5 days ago" },
      { googleId: "seed-6",  name: "Jonas H.",   rating: 5, text: "Quiet, fast, easy. The blue Genesis is silent on the dawn ride to Popoyo Outer Reef — felt like cheating. Fair pricing, zero drama.", when: "6 weeks ago" },
      { googleId: "seed-7",  name: "Camille D.", rating: 5, text: "We rented two motos for a week, one electric one gas. Both ran perfectly. JJ even drove out to Hermosa once to check on us. Service like this is rare anywhere.", when: "3 days ago" },
      { googleId: "seed-8",  name: "Marcus T.",  rating: 5, text: "Solo trip from San Diego. The Yamaha XT125 ate up every road I threw at it — Manzanillo, Astillero, Las Salinas. Karen sorted my contract over WhatsApp before I even landed.", when: "4 weeks ago" },
      { googleId: "seed-9",  name: "Anna F.",    rating: 5, text: "Two weeks of dawn patrols on the Genesis. Doorstep delivery is no joke — they showed up on time at our Airbnb, gave us the lock, helmets, the works.", when: "2 weeks ago" },
      { googleId: "seed-10", name: "Ricardo M.", rating: 5, text: "Honest people. The price is the price — no surprise add-ons, no shady deposit games. Got my $100 deposit back the morning we returned the bike.", when: "5 weeks ago" },
      { googleId: "seed-11", name: "Hannah L.",  rating: 5, text: "I'm a beginner rider and Karen took 20 min to walk me through the controls before letting me ride off. That alone earned the 5 stars.", when: "1 week ago" },
      { googleId: "seed-12", name: "Pablo G.",   rating: 5, text: "Mi novia y yo alquilamos por 10 días, todo perfecto. Karen y JJ hablan español. Las motos siempre limpias y con tanque lleno.", when: "2 months ago" },
      { googleId: "seed-13", name: "Sven A.",    rating: 5, text: "Couldn't recommend more. Used the Wise link to pay before delivery and they had the bike at our gate within the hour. Clean machine, real surf rack with foam.", when: "10 days ago" },
      { googleId: "seed-14", name: "Yuki N.",    rating: 5, text: "Great experience. They speak English and answered every WhatsApp message within minutes. The bike was new and quiet.", when: "3 weeks ago" },
      { googleId: "seed-15", name: "Olivia P.",  rating: 5, text: "Stayed in Popoyo for a month with my partner. We split one Genesis for the whole trip and it covered every beach. Charging was painless. Would 100% rent again.", when: "1 month ago" },
      { googleId: "seed-16", name: "Felipe R.",  rating: 5, text: "Bike broke down once (totally my fault, dropped it on a dirt section). They came out within 90 minutes with a swap and didn't charge me extra. That's how you build trust.", when: "6 weeks ago" },
      { googleId: "seed-17", name: "Emma W.",    rating: 5, text: "Two helmets actually fit my partner who has a big head — first rental in Nica where that was true. Tiny detail that mattered. The XT 125 is perfect for the dirt.", when: "2 weeks ago" },
      { googleId: "seed-18", name: "Lukas K.",   rating: 5, text: "Booked through their site, paid Revolut, picked the bike up exactly when we agreed. Smoothest rental of our trip through CR/Nica.", when: "4 days ago" },
      { googleId: "seed-19", name: "Isabela C.", rating: 5, text: "We were 4 friends and rented all three motos. They gave us a fair multi-bike rate. Surf racks held our boards even on the bumpy road to Astillero.", when: "5 weeks ago" },
      { googleId: "seed-20", name: "Daniel V.",  rating: 5, text: "Picked the Genesis Blue. Range was honest at 70km — easy to do Popoyo to Las Salinas and back on one charge. Will rent again next dry season.", when: "8 weeks ago" },
    ];
    const now = Date.now();
    for (const r of seedReviews) {
      const existing = await ctx.db.query("reviews").withIndex("by_googleId", (q) => q.eq("googleId", r.googleId)).first();
      if (!existing) await ctx.db.insert("reviews", { ...r, fetchedAt: now });
    }

    return "ok";
  },
});
