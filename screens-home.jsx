// Home screen and reusable shells.

const REVIEWS = [
  { name: 'Marina S.', when: '2 weeks ago', text: 'Karen and JJ delivered the moto right to our hostel — surf rack already on, two helmets, full tank. The Genesis was perfect for the dirt roads to Playa Santana.' },
  { name: 'Tom R.', when: '1 month ago', text: 'Best moto experience in Popoyo. Brand-new electric, charged it once during a 4-day rental. Highly recommend.' },
  { name: 'Léa B.', when: '3 weeks ago', text: 'On honeymoon and these guys made it so easy. Picked us up from the hotel, contract on the phone, done in 10 minutes. The XT 125 handled Guasacate like a dream.' },
  { name: 'Diego A.', when: '2 months ago', text: 'Rented for 3 weeks and got a great monthly rate. Moto was spotless, helmets actually fit, and they came to swap a tire when I picked up a nail. Real local service.' },
  { name: 'Sophie K.', when: '5 days ago', text: 'I was nervous about renting in Nica but Karen walked me through everything. Surf rack fits a 6\'2 longboard no problem. Five stars, will be back next dry season.' },
  { name: 'Jonas H.', when: '6 weeks ago', text: 'Quiet, fast, easy. The blue Genesis is silent on the dawn ride to Popoyo Outer Reef — felt like cheating. Fair pricing, zero drama.' },
];

function StarsRow({ count = 5, size = 13 }) {
  return (
    <div style={{ display: 'inline-flex', gap: 2 }}>
      {Array.from({ length: count }).map((_, i) => <IconStar key={i} size={size} />)}
    </div>
  );
}

function ReviewCard({ r }) {
  return (
    <div style={{
      flex: '0 0 86%', maxWidth: 320, padding: 18, borderRadius: 18,
      background: '#fff', border: '1px solid var(--line)',
      display: 'flex', flexDirection: 'column', gap: 10, scrollSnapAlign: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', background: '#f3f3f3',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 13, color: '#444',
          }}>{r.name.split(' ').map(s=>s[0]).join('').slice(0,2)}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.when}</div>
          </div>
        </div>
        <StarsRow />
      </div>
      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink-2)', textWrap: 'pretty' }}>{r.text}</p>
      <div style={{ fontSize: 10.5, color: 'var(--muted)', letterSpacing: 0.4, textTransform: 'uppercase' }}>via Google reviews</div>
    </div>
  );
}

function ReviewsCarousel() {
  const ref = React.useRef(null);
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => {
      setIdx(i => {
        const n = (i + 1) % REVIEWS.length;
        const el = ref.current;
        if (el) {
          const card = el.children[n];
          if (card) el.scrollTo({ left: card.offsetLeft - 16, behavior: 'smooth' });
        }
        return n;
      });
    }, 4500);
    return () => clearInterval(t);
  }, []);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10, padding: '0 20px' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 1.2, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>Reviews</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>5.0 · {REVIEWS.length * 7} riders</div>
        </div>
        <StarsRow size={15} />
      </div>
      <div ref={ref} className="phone-scroll" style={{
        display: 'flex', gap: 12, overflowX: 'auto', scrollSnapType: 'x mandatory',
        padding: '4px 16px 8px', scrollBehavior: 'smooth',
      }}>
        {REVIEWS.map((r, i) => <ReviewCard key={i} r={r} />)}
      </div>
      <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginTop: 8 }}>
        {REVIEWS.map((_, i) => (
          <div key={i} style={{
            width: i === idx ? 16 : 5, height: 5, borderRadius: 4,
            background: i === idx ? 'var(--ink)' : '#d6d6d6', transition: 'all .3s',
          }} />
        ))}
      </div>
    </div>
  );
}

function FeatureRow() {
  const items = [
    { emoji: '🏄', label: 'Surf rack' },
    { image: 'assets/helmet.png', label: '2 helmets' },
    { emoji: '🏍️', label: 'Doorstep delivery' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: '0 20px' }}>
      {items.map((it) => (
        <div key={it.label} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          padding: '14px 8px', borderRadius: 14, background: '#fafafa', border: '1px solid var(--line)',
        }}>
          {it.image
            ? <img src={it.image} alt={it.label} style={{ width: 30, height: 30, objectFit: 'contain' }} />
            : <div style={{ fontSize: 26, lineHeight: 1, fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif' }}>{it.emoji}</div>
          }
          <div style={{ fontSize: 11.5, fontWeight: 500, textAlign: 'center' }}>{it.label}</div>
        </div>
      ))}
    </div>
  );
}

function MotoMiniCard({ b, price }) {
  return (
    <div style={{
      flex: '0 0 70%', maxWidth: 240, scrollSnapAlign: 'start',
      borderRadius: 16, border: '1px solid var(--line)', overflow: 'hidden', background: '#fff',
    }}>
      <div style={{ background: '#fafafa', padding: '12px 8px 0' }}>
        <BikeIllustration accent={b.accent} body={b.body} seat={b.seat} image={b.image} height={110} label={b.name} />
      </div>
      <div style={{ padding: '10px 14px 14px', borderTop: '1px solid var(--line)' }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{b.name} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>· {b.color}</span></div>
        <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{b.type} · {b.range}</div>
        <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600 }}>${price}<span style={{ color: 'var(--muted)', fontWeight: 400 }}> /day</span></div>
      </div>
    </div>
  );
}

function HomeScreen({ onStart, pricing, ctaLabel = 'Rent a motorcycle' }) {
  return (
    <div className="phone-scroll" style={{ height: '100%', overflowY: 'auto', paddingBottom: 24 }}>
      {/* Hero with logo */}
      <div style={{ padding: '14px 20px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="assets/logo.png" alt="Karen & JJ" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.1 }}>Karen & JJ</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Moto Rental · Popoyo</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: '#fafafa', borderRadius: 999, border: '1px solid var(--line)' }}>
          <IconStar size={11} />
          <span style={{ fontSize: 11.5, fontWeight: 600 }}>5.0</span>
        </div>
      </div>

      {/* Quick contact buttons */}
      <div style={{ padding: '12px 16px 0', display: 'flex', gap: 10 }}>
        <a href="https://wa.me/50589750052" target="_blank" rel="noreferrer" style={footerLinkStyle('#25D366')}>
          <IconChat size={18} color="#fff" />
          <span>WhatsApp</span>
        </a>
        <a href="https://share.google/IXOC6DlEv7Zk9d18W" target="_blank" rel="noreferrer" style={footerLinkStyle('#1a73e8')}>
          <IconMap size={18} color="#fff" />
          <span>Find us</span>
        </a>
      </div>

      {/* Feature row */}
      <div style={{ paddingTop: 18 }}>
        <FeatureRow />
      </div>

      {/* Pricing pills (under feature row) */}
      <div style={{ padding: '14px 20px 0', display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={pricePillStyle}><b>${pricing.daily}</b> /day</div>
        <div style={pricePillStyle}><b>${pricing.weekly}</b> /week</div>
        <div style={pricePillStyle}><b>${pricing.monthly}</b> /month</div>
      </div>

      {/* Moto grid */}
      <div style={{ padding: '24px 0 0' }}>
        <div className="phone-scroll" style={{
          display: 'flex', gap: 12, overflowX: 'auto', padding: '4px 16px 4px',
          scrollSnapType: 'x mandatory',
        }}>
          {BIKE_FLEET.map(b => <MotoMiniCard key={b.id} b={b} price={pricing.daily} />)}
        </div>
      </div>

      {/* Primary CTA (above reviews) */}
      <div style={{ padding: '24px 16px 0' }}>
        <button onClick={onStart} style={{
          width: '100%', padding: '17px 20px', borderRadius: 999, border: 'none',
          background: '#25D366', color: '#fff', fontSize: 16, fontWeight: 600,
          boxShadow: '0 12px 32px rgba(37,211,102,0.32)', display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer',
        }}>
          {ctaLabel} <IconArrowRight size={18} color="#fff" />
        </button>
      </div>

      {/* Reviews */}
      <div style={{ padding: '28px 0 0' }}>
        <ReviewsCarousel />
      </div>

      <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', padding: '20px 0 6px' }}>
        +505 8975 0052 · +505 7718 5403 · Popoyo, Nicaragua
      </div>
    </div>
  );
}

const pricePillStyle = {
  padding: '8px 14px', borderRadius: 999, background: '#fafafa',
  border: '1px solid var(--line)', fontSize: 13, color: 'var(--ink-2)',
};

function footerLinkStyle(bg) {
  return {
    flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '14px 12px', borderRadius: 14, background: bg, color: '#fff',
    textDecoration: 'none', fontSize: 14, fontWeight: 600,
  };
}

function StickyCTA({ onStart, label = 'Rent a motorcycle' }) {
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 18, padding: '0 16px',
      pointerEvents: 'none',
    }}>
      <button onClick={onStart} style={{
        pointerEvents: 'auto',
        width: '100%', padding: '17px 20px', borderRadius: 999, border: 'none',
        background: 'var(--ink)', color: '#fff', fontSize: 16, fontWeight: 600,
        boxShadow: '0 12px 32px rgba(0,0,0,0.22)', display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center', gap: 10,
      }}>
        {label} <IconArrowRight size={18} color="#fff" />
      </button>
    </div>
  );
}

// Reusable header for sub-screens
function StepHeader({ onBack, title, step, total }) {
  return (
    <div style={{ padding: '12px 16px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <button onClick={onBack} style={{
        width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--line)',
        background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}><IconChevronLeft size={18} /></button>
      <div style={{ flex: 1 }}>
        {step != null && <div style={{ fontSize: 10.5, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>Step {step} of {total}</div>}
        <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{title}</div>
      </div>
    </div>
  );
}

function ProgressBar({ step, total }) {
  return (
    <div style={{ height: 3, background: '#f0f0f0', margin: '0 16px', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${(step/total)*100}%`, background: 'var(--ink)', transition: 'width .3s' }} />
    </div>
  );
}

function PrimaryButton({ onClick, children, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: '100%', padding: '15px 20px', borderRadius: 14, border: 'none',
      background: disabled ? '#cfcfcf' : 'var(--ink)', color: '#fff',
      fontSize: 15, fontWeight: 600, display: 'inline-flex',
      alignItems: 'center', justifyContent: 'center', gap: 8,
      opacity: disabled ? 0.7 : 1, cursor: disabled ? 'not-allowed' : 'pointer',
    }}>
      {children}
    </button>
  );
}

Object.assign(window, {
  HomeScreen, StickyCTA, StepHeader, ProgressBar, PrimaryButton, StarsRow, REVIEWS,
});
