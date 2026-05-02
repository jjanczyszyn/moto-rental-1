// Bike data + reusable bike card SVG illustration (placeholder).
// Backend-configurable defaults for pricing live in TWEAK_DEFAULTS in app.jsx.

const BIKE_FLEET = [
  {
    id: 'genesis-red',
    name: 'Genesis KLIK',
    color: 'Red',
    type: 'Electric',
    plate: 'POP-217',
    range: '70 km range',
    accent: '#e23d2c',
    body: '#cf2e1f',
    seat: '#1a1a1a',
    image: 'assets/genesis-red.png',
    available: true,
  },
  {
    id: 'genesis-blue',
    name: 'Genesis KLIK',
    color: 'Blue',
    type: 'Electric',
    plate: 'POP-184',
    range: '70 km range',
    accent: '#2a6bd1',
    body: '#1f56b0',
    seat: '#1a1a1a',
    image: 'assets/genesis-blue.png',
    available: true,
  },
  {
    id: 'yamaha-xt',
    name: 'Yamaha XT 125',
    color: 'White',
    type: 'Gas',
    plate: 'POP-302',
    range: '125cc · 4-speed',
    accent: '#222222',
    body: '#f4f4f4',
    seat: '#1a1a1a',
    image: 'assets/yamaha-xt125.png',
    available: true,
  },
];

// Original SVG illustration of a moto silhouette (not a brand drawing).
// If a bike provides `image`, render the photo instead.
function BikeIllustration({ accent = '#ff5a3c', body = '#1a1a1a', seat = '#1a1a1a', height = 130, label = 'moto', image = null }) {
  if (image) {
    return (
      <div style={{ width: '100%', height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={image} alt={label} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
      </div>
    );
  }
  return (
    <svg viewBox="0 0 320 160" width="100%" height={height} role="img" aria-label={label} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`g-${accent.replace('#','')}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={accent} stopOpacity="0.95" />
          <stop offset="1" stopColor={accent} stopOpacity="0.7" />
        </linearGradient>
      </defs>
      {/* ground */}
      <line x1="10" y1="135" x2="310" y2="135" stroke="#e6e6e6" strokeDasharray="2 4" />
      {/* surf rack on top */}
      <g>
        <rect x="120" y="42" width="120" height="6" rx="2" fill="#0a0a0a" />
        <rect x="135" y="32" width="90" height="14" rx="3" fill={accent} opacity="0.85" />
        <line x1="150" y1="32" x2="150" y2="46" stroke="#fff" strokeWidth="1" opacity="0.5" />
        <line x1="170" y1="32" x2="170" y2="46" stroke="#fff" strokeWidth="1" opacity="0.5" />
        <line x1="190" y1="32" x2="190" y2="46" stroke="#fff" strokeWidth="1" opacity="0.5" />
        <line x1="210" y1="32" x2="210" y2="46" stroke="#fff" strokeWidth="1" opacity="0.5" />
      </g>
      {/* frame body */}
      <path d="M70 110 L130 80 L210 80 L240 70 L255 100 L220 110 L160 115 L110 115 Z"
            fill={`url(#g-${accent.replace('#','')})`} stroke="#0a0a0a" strokeWidth="1.5" />
      {/* tank highlight */}
      <path d="M150 82 L200 82 L195 95 L155 95 Z" fill="#fff" opacity="0.18" />
      {/* seat */}
      <path d="M195 78 L240 70 L245 80 L200 86 Z" fill={seat} />
      {/* handlebar */}
      <path d="M105 65 L122 80" stroke="#0a0a0a" strokeWidth="3" strokeLinecap="round" />
      <path d="M99 60 L115 60" stroke="#0a0a0a" strokeWidth="3" strokeLinecap="round" />
      {/* headlight */}
      <circle cx="100" cy="70" r="6" fill="#0a0a0a" />
      <circle cx="100" cy="70" r="3" fill="#fff48f" />
      {/* exhaust */}
      <rect x="225" y="105" width="40" height="5" rx="2" fill="#9a9a9a" />
      {/* wheels */}
      <circle cx="80" cy="120" r="22" fill="#0a0a0a" />
      <circle cx="80" cy="120" r="10" fill="none" stroke="#3a3a3a" strokeWidth="1.5" />
      <circle cx="80" cy="120" r="4" fill="#5a5a5a" />
      <circle cx="240" cy="120" r="22" fill="#0a0a0a" />
      <circle cx="240" cy="120" r="10" fill="none" stroke="#3a3a3a" strokeWidth="1.5" />
      <circle cx="240" cy="120" r="4" fill="#5a5a5a" />
      {/* helmets stacked behind */}
      <g opacity="0.95">
        <circle cx="265" cy="80" r="9" fill={accent} />
        <rect x="256" y="80" width="18" height="3" fill="#0a0a0a" opacity="0.4" />
      </g>
    </svg>
  );
}

Object.assign(window, { BIKE_FLEET, BikeIllustration });
