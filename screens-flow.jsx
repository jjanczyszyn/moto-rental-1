// All flow screens after Home: Calendar, BikePick, OCR, Phone, Payment, Contract, Delivery, Done

// ─── CALENDAR (Airbnb-style scrolling months) ───────────────────────────
function fmtMonth(d) { return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); }
function sameDay(a, b) { return a && b && a.toDateString() === b.toDateString(); }
function daysBetween(a, b) { return Math.round((b - a) / 86400000); }

function MonthGrid({ year, month, start, end, onPick }) {
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date(); today.setHours(0,0,0,0);
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return (
    <div style={{ padding: '8px 16px 24px' }}>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{fmtMonth(first)}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {['S','M','T','W','T','F','S'].map((l, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', padding: '4px 0' }}>{l}</div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const past = d < today;
          const isStart = sameDay(d, start);
          const isEnd = sameDay(d, end);
          const inRange = start && end && d > start && d < end;
          const selected = isStart || isEnd;
          return (
            <button key={i} disabled={past} onClick={() => onPick(d)} style={{
              border: 'none', background: selected ? 'var(--ink)' : inRange ? '#f3f3f3' : 'transparent',
              color: selected ? '#fff' : past ? '#cfcfcf' : 'var(--ink)',
              borderRadius: selected ? 999 : inRange ? 0 : 999,
              aspectRatio: '1', fontSize: 14, fontWeight: selected ? 700 : 500,
              textDecoration: past ? 'line-through' : 'none',
              cursor: past ? 'not-allowed' : 'pointer',
              padding: 0,
            }}>{d.getDate()}</button>
          );
        })}
      </div>
    </div>
  );
}

function CalendarScreen({ state, set, onBack, onNext }) {
  const { startDate, endDate } = state;
  const today = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const onPick = (d) => {
    if (!startDate || (startDate && endDate)) { set({ startDate: d, endDate: null }); return; }
    if (d <= startDate) { set({ startDate: d, endDate: null }); return; }
    set({ startDate, endDate: d });
  };
  const nights = startDate && endDate ? daysBetween(startDate, endDate) : 0;
  const fmt = (d) => d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <StepHeader onBack={onBack} title="When do you need it?" step={1} total={7} />
      <ProgressBar step={1} total={7} />
      <div style={{ padding: '14px 16px 8px', display: 'flex', gap: 8 }}>
        <div style={pillBox(startDate)}>
          <div style={pillLabel}>Pick-up</div>
          <div style={pillValue}>{fmt(startDate)}</div>
        </div>
        <div style={pillBox(endDate)}>
          <div style={pillLabel}>Drop-off</div>
          <div style={pillValue}>{fmt(endDate)}</div>
        </div>
      </div>
      <div className="phone-scroll" style={{ flex: 1, overflowY: 'auto' }}>
        {months.map(({ y, m }) => (
          <MonthGrid key={`${y}-${m}`} year={y} month={m} start={startDate} end={endDate} onPick={onPick} />
        ))}
      </div>
      <div style={{ padding: 16, borderTop: '1px solid var(--line)', background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, fontSize: 13 }}>
          <span style={{ color: 'var(--muted)' }}>{nights ? `${nights} ${nights === 1 ? 'day' : 'days'}` : 'Select your dates'}</span>
          {nights > 0 && <span style={{ fontWeight: 600 }}>${state.pricing.computeTotal(nights)} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>est.</span></span>}
        </div>
        <PrimaryButton disabled={!startDate || !endDate} onClick={onNext}>Continue</PrimaryButton>
      </div>
    </div>
  );
}
const pillBox = (active) => ({
  flex: 1, padding: '10px 14px', borderRadius: 12, border: `1px solid ${active ? 'var(--ink)' : 'var(--line)'}`,
  background: active ? '#fafafa' : '#fff',
});
const pillLabel = { fontSize: 10.5, color: 'var(--muted)', letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 600 };
const pillValue = { fontSize: 14, fontWeight: 600, marginTop: 2 };

// ─── MOTO SELECTION ─────────────────────────────────────────────────────
function BikePickScreen({ state, set, onBack, onNext }) {
  const nights = state.startDate && state.endDate ? daysBetween(state.startDate, state.endDate) : 1;
  const pricePer = () => state.pricing.daily;
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <StepHeader onBack={onBack} title="Choose your moto" step={2} total={7} />
      <ProgressBar step={2} total={7} />
      <div style={{ padding: '12px 16px 0', fontSize: 12.5, color: 'var(--muted)' }}>
        {nights} {nights === 1 ? 'day' : 'days'} · {nights >= 30 ? 'monthly rate applied' : nights >= 7 ? 'weekly rate applied' : 'daily rate'}
      </div>
      <div className="phone-scroll" style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 100px' }}>
        {BIKE_FLEET.map(b => {
          const selected = state.bikeId === b.id;
          const total = state.pricing.computeTotal(nights);
          return (
            <button key={b.id} onClick={() => set({ bikeId: b.id })} disabled={!b.available} style={{
              display: 'block', width: '100%', textAlign: 'left',
              border: `1.5px solid ${selected ? 'var(--ink)' : 'var(--line)'}`,
              background: '#fff', borderRadius: 18, padding: 0, marginBottom: 12,
              overflow: 'hidden', cursor: 'pointer',
            }}>
              <div style={{ background: '#fafafa', padding: '14px 12px 4px' }}>
                <BikeIllustration accent={b.accent} body={b.body} seat={b.seat} image={b.image} height={140} label={b.name} />
              </div>
              <div style={{ padding: '12px 16px 14px', borderTop: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{b.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{b.color} · {b.type} · {b.range}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>${pricePer()}<span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>/day</span></div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>${total} total</div>
                  </div>
                </div>
                {selected && (
                  <div style={{ marginTop: 12, padding: 10, background: '#fafafa', borderRadius: 10, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconCheck size={16} color="#16a34a" />
                    <span>Includes surf rack, two helmets and delivery</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <div style={{ padding: 16, borderTop: '1px solid var(--line)', background: '#fff' }}>
        <PrimaryButton disabled={!state.bikeId} onClick={onNext}>Continue</PrimaryButton>
      </div>
    </div>
  );
}

// ─── OCR DOCUMENT UPLOAD ────────────────────────────────────────────────
function OCRScreen({ state, set, onBack, onNext }) {
  const [phase, setPhase] = React.useState(state.docFirstName ? 'done' : 'idle'); // idle | scanning | done
  const fileRef = React.useRef(null);
  const onUpload = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhase('scanning');
    setTimeout(() => {
      // Mocked extraction
      set({
        docFirstName: 'Alex',
        docLastName: 'Morales Ruiz',
        docNumber: 'X3' + Math.floor(Math.random()*1e7).toString().padStart(7,'0'),
        docExpiry: '2031-08-14',
        docCountry: 'United States',
      });
      setPhase('done');
    }, 2400);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <StepHeader onBack={onBack} title="Verify your ID" step={3} total={7} />
      <ProgressBar step={3} total={7} />
      <div className="phone-scroll" style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 100px' }}>
        <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.5, margin: '8px 0 16px' }}>
          Upload a photo of your driver's license or passport. We'll fill in your details automatically.
        </p>

        {phase === 'idle' && (
          <button onClick={() => fileRef.current?.click()} style={uploadCard}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--line)' }}>
              <IconUpload size={26} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Upload document photo</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>JPG, PNG or HEIC · max 8 MB</div>
          </button>
        )}

        {phase === 'scanning' && (
          <div style={{ ...uploadCard, cursor: 'default', borderStyle: 'solid' }}>
            <div style={{ position: 'relative', width: 220, height: 140, background: '#0a0a0a', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent 0 8px, rgba(255,255,255,0.04) 8px 9px)' }} />
              <div style={{
                position: 'absolute', left: 0, right: 0, height: 2, background: 'var(--accent)',
                boxShadow: '0 0 12px var(--accent)',
                animation: 'scan 1.6s ease-in-out infinite',
              }} />
              <div style={{ position: 'absolute', top: 8, left: 8, color: '#fff', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', opacity: 0.7 }}>SCANNING…</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Reading your document</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Extracting name, number, expiry, country</div>
            <style>{`@keyframes scan { 0% { top: 4%; } 50% { top: 92%; } 100% { top: 4%; } }`}</style>
          </div>
        )}

        {phase === 'done' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#16a34a', fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
              <IconCheck size={18} color="#16a34a" /> Extracted from your document
            </div>
            <Field label="First name" value={state.docFirstName} onChange={v => set({ docFirstName: v })} />
            <Field label="Last name(s)" value={state.docLastName} onChange={v => set({ docLastName: v })} />
            <Field label="Document number" value={state.docNumber} onChange={v => set({ docNumber: v })} mono />
            <Field label="Expiry date" value={state.docExpiry} onChange={v => set({ docExpiry: v })} mono />
            <Field label="Country" value={state.docCountry} onChange={v => set({ docCountry: v })} />
            <button onClick={() => { setPhase('idle'); set({ docFirstName: '', docLastName: '', docNumber: '', docExpiry: '', docCountry: '' }); }} style={{
              marginTop: 4, background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 12, padding: 6, display: 'inline-flex', alignItems: 'center', gap: 6,
            }}><IconRefresh size={13} /> Re-scan document</button>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onUpload} />
      </div>
      <div style={{ padding: 16, borderTop: '1px solid var(--line)', background: '#fff' }}>
        <PrimaryButton disabled={phase !== 'done' || !state.docFirstName} onClick={onNext}>Continue</PrimaryButton>
      </div>
    </div>
  );
}
const uploadCard = {
  width: '100%', border: '1.5px dashed #d8d8d8', borderRadius: 16,
  background: '#fff', padding: '32px 16px', display: 'flex', flexDirection: 'column',
  alignItems: 'center', gap: 10, cursor: 'pointer',
};

function Field({ label, value, onChange, mono, placeholder, type = 'text', inputStyle }) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <input type={type} value={value || ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={{
        width: '100%', padding: '13px 14px', borderRadius: 12, border: '1px solid var(--line)',
        fontSize: 15, background: '#fff', outline: 'none',
        fontFamily: mono ? 'JetBrains Mono, monospace' : 'inherit',
        ...(inputStyle || {}),
      }} onFocus={(e) => e.target.style.borderColor = 'var(--ink)'} onBlur={(e) => e.target.style.borderColor = 'var(--line)'} />
    </label>
  );
}

// ─── PHONE NUMBER ───────────────────────────────────────────────────────
// Curated top-of-list countries; full ISO list follows.
const COUNTRY_CODES = [
  { code: '+505', name: 'Nicaragua', flag: '🇳🇮' },
  { code: '+1',   name: 'USA / Canada', flag: '🇺🇸' },
  { code: '+52',  name: 'Mexico', flag: '🇲🇽' },
  { code: '+506', name: 'Costa Rica', flag: '🇨🇷' },
  { code: '+33',  name: 'France', flag: '🇫🇷' },
  { code: '+34',  name: 'Spain', flag: '🇪🇸' },
  { code: '+44',  name: 'UK', flag: '🇬🇧' },
  { code: '+49',  name: 'Germany', flag: '🇩🇪' },
  { code: '+31',  name: 'Netherlands', flag: '🇳🇱' },
  { code: '+61',  name: 'Australia', flag: '🇦🇺' },
  { code: '+39',  name: 'Italy', flag: '🇮🇹' },
  { code: '+41',  name: 'Switzerland', flag: '🇨🇭' },
  { code: '+43',  name: 'Austria', flag: '🇦🇹' },
  { code: '+32',  name: 'Belgium', flag: '🇧🇪' },
  { code: '+45',  name: 'Denmark', flag: '🇩🇰' },
  { code: '+46',  name: 'Sweden', flag: '🇸🇪' },
  { code: '+47',  name: 'Norway', flag: '🇳🇴' },
  { code: '+358', name: 'Finland', flag: '🇫🇮' },
  { code: '+48',  name: 'Poland', flag: '🇵🇱' },
  { code: '+420', name: 'Czechia', flag: '🇨🇿' },
  { code: '+351', name: 'Portugal', flag: '🇵🇹' },
  { code: '+353', name: 'Ireland', flag: '🇮🇪' },
  { code: '+30',  name: 'Greece', flag: '🇬🇷' },
  { code: '+972', name: 'Israel', flag: '🇮🇱' },
  { code: '+90',  name: 'Turkey', flag: '🇹🇷' },
  { code: '+7',   name: 'Russia', flag: '🇷🇺' },
  { code: '+380', name: 'Ukraine', flag: '🇺🇦' },
  { code: '+86',  name: 'China', flag: '🇨🇳' },
  { code: '+81',  name: 'Japan', flag: '🇯🇵' },
  { code: '+82',  name: 'South Korea', flag: '🇰🇷' },
  { code: '+91',  name: 'India', flag: '🇮🇳' },
  { code: '+62',  name: 'Indonesia', flag: '🇮🇩' },
  { code: '+65',  name: 'Singapore', flag: '🇸🇬' },
  { code: '+66',  name: 'Thailand', flag: '🇹🇭' },
  { code: '+84',  name: 'Vietnam', flag: '🇻🇳' },
  { code: '+63',  name: 'Philippines', flag: '🇵🇭' },
  { code: '+64',  name: 'New Zealand', flag: '🇳🇿' },
  { code: '+27',  name: 'South Africa', flag: '🇿🇦' },
  { code: '+20',  name: 'Egypt', flag: '🇪🇬' },
  { code: '+971', name: 'UAE', flag: '🇦🇪' },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+55',  name: 'Brazil', flag: '🇧🇷' },
  { code: '+54',  name: 'Argentina', flag: '🇦🇷' },
  { code: '+56',  name: 'Chile', flag: '🇨🇱' },
  { code: '+57',  name: 'Colombia', flag: '🇨🇴' },
  { code: '+51',  name: 'Peru', flag: '🇵🇪' },
  { code: '+598', name: 'Uruguay', flag: '🇺🇾' },
  { code: '+507', name: 'Panama', flag: '🇵🇦' },
  { code: '+502', name: 'Guatemala', flag: '🇬🇹' },
  { code: '+503', name: 'El Salvador', flag: '🇸🇻' },
  { code: '+504', name: 'Honduras', flag: '🇭🇳' },
];
function PhoneScreen({ state, set, onBack, onNext }) {
  const [ccOpen, setCcOpen] = React.useState(false);
  const [ccQuery, setCcQuery] = React.useState('');
  const wrapRef = React.useRef(null);
  React.useEffect(() => {
    if (!ccOpen) return;
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setCcOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [ccOpen]);

  const currentCC = state.phoneCC || '+505';
  const currentEntry = COUNTRY_CODES.find(c => c.code === currentCC) || COUNTRY_CODES[0];

  const q = ccQuery.trim().toLowerCase();
  const filtered = q
    ? COUNTRY_CODES.filter(c =>
        c.code.toLowerCase().includes(q) ||
        c.code.replace('+', '').includes(q.replace('+', '')) ||
        c.name.toLowerCase().includes(q)
      )
    : COUNTRY_CODES;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <StepHeader onBack={onBack} title="Your WhatsApp number" step={4} total={7} />
      <ProgressBar step={4} total={7} />
      <div style={{ flex: 1, padding: '8px 16px' }}>
        <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.5, margin: '8px 0 18px' }}>
          We'll send your contract, delivery details and roadside support over WhatsApp.
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <div ref={wrapRef} style={{ position: 'relative', flex: '0 0 110px' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>Code</div>
            <button type="button" onClick={() => { setCcOpen(o => !o); setCcQuery(''); }} style={{
              width: '100%', padding: '13px 10px', borderRadius: 12, border: '1px solid var(--line)',
              background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
              fontSize: 15, height: 48,
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'JetBrains Mono, monospace' }}>
                <span style={{ fontSize: 18, lineHeight: 1, fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' }}>{currentEntry.flag}</span>
                <span>{currentEntry.code}</span>
              </span>
              <span style={{ color: 'var(--muted)', fontSize: 10 }}>▾</span>
            </button>
            {ccOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, width: 240, zIndex: 30, background: '#fff', border: '1px solid var(--line)', borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
                <input
                  autoFocus
                  value={ccQuery}
                  onChange={e => setCcQuery(e.target.value)}
                  placeholder="Search code or country"
                  style={{ width: '100%', padding: '12px 12px', border: 'none', borderBottom: '1px solid var(--line)', outline: 'none', fontSize: 13, fontFamily: 'inherit' }}
                />
                <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                  {filtered.map(c => (
                    <button key={c.code + c.name} type="button" onClick={() => { set({ phoneCC: c.code }); setCcOpen(false); }} style={{
                      width: '100%', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
                      background: c.code === currentCC ? '#fafafa' : '#fff', border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}>
                      <span style={{ fontSize: 18, lineHeight: 1, fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' }}>{c.flag}</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 500 }}>{c.code}</span>
                      <span style={{ fontSize: 12.5, color: 'var(--muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <div style={{ padding: '12px', fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>No match</div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <Field label="Phone number" value={state.phoneNum} onChange={v => set({ phoneNum: v.replace(/[^0-9 ]/g, '') })} mono placeholder="8975 0052" type="tel" inputStyle={{ height: 48, padding: '0 14px' }} />
          </div>
        </div>
        {(() => {
          const digits = (state.phoneNum || '').replace(/\D/g, '');
          const tooShort = digits.length > 0 && digits.length < 7;
          if (!tooShort) return null;
          return (
            <div style={{ marginTop: 14, padding: 12, background: '#fff8f1', border: '1px solid #f5c89e', borderRadius: 12 }}>
              <div style={{ fontSize: 12.5, color: '#9a4a07', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ display: 'inline-flex', width: 16, height: 16, borderRadius: '50%', background: '#e0832a', color: '#fff', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>!</span>
                That number looks short
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5, marginBottom: 10 }}>
                A WhatsApp number is usually 7+ digits. If yours really is shorter, leave a quick note explaining and we'll review it before delivery.
              </div>
              <textarea
                value={state.phoneNote || ''}
                onChange={e => set({ phoneNote: e.target.value })}
                placeholder="e.g. short business line, alternate WhatsApp on +505 1234"
                rows={3}
                style={{
                  width: '100%', resize: 'vertical', minHeight: 64,
                  padding: 10, borderRadius: 10, border: '1px solid var(--line)',
                  fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff',
                }}
              />
            </div>
          );
        })()}
      </div>
      <div style={{ padding: 16, borderTop: '1px solid var(--line)', background: '#fff' }}>
        {(() => {
          const digits = (state.phoneNum || '').replace(/\D/g, '');
          const tooShort = digits.length > 0 && digits.length < 7;
          const noteOk = (state.phoneNote || '').trim().length >= 10;
          const ok = digits.length >= 7 || (tooShort && noteOk);
          return <PrimaryButton disabled={!ok} onClick={onNext}>Continue</PrimaryButton>;
        })()}
      </div>
    </div>
  );
}

// ─── PAYMENT ────────────────────────────────────────────────────────────
const PAY_METHODS = [
  { id: 'cash',     label: 'Cash on delivery', sub: 'USD or córdobas at hand-off', icon: <IconCash size={20} />,
    detail: ['Pay Karen or JJ in USD or córdobas when we deliver the moto.'] },
  { id: 'venmo',    label: 'Venmo', sub: '@justina-lydia', icon: <IconBank size={20} />,
    detail: ['Send to @justina-lydia (Justyna Janczyszyn).'] },
  { id: 'zelle',    label: 'Zelle', sub: '6469340781', icon: <IconBank size={20} />,
    detail: ['Phone: 646 934 0781', 'Recipient: Justyna Janczyszyn'] },
  { id: 'paypal',   label: 'PayPal', sub: 'justinalydiacuddles@gmail.com', icon: <IconBank size={20} />,
    detail: ['Email: justinalydiacuddles@gmail.com', 'Friends & Family preferred (no fee).'] },
  { id: 'wise',     label: 'Wise', sub: 'wise.com/pay/me/justynaj102', icon: <IconBank size={20} />,
    detail: ['Pay link: wise.com/pay/me/justynaj102'] },
  { id: 'revolut',  label: 'Revolut', sub: '@justynshx', icon: <IconBank size={20} />,
    detail: ['Send to @justynshx (Justyna Janczyszyn).'] },
  { id: 'transfer-usd', label: 'Bank transfer · USD', sub: 'US routing', icon: <IconBank size={20} />,
    detail: ['Beneficiary: Justyna Janczyszyn', 'Routing: 026073150', 'Account: 822000215918'] },
  { id: 'transfer-eur', label: 'Bank transfer · EUR', sub: 'IBAN (Belgium)', icon: <IconBank size={20} />,
    detail: ['Beneficiary: Justyna Janczyszyn', 'IBAN: BE06 9671 9692 5322'] },
];

function PaymentScreen({ state, set, onBack, onNext }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <StepHeader onBack={onBack} title="How will you pay?" step={5} total={7} />
      <ProgressBar step={5} total={7} />
      <div className="phone-scroll" style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 16px' }}>
        <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.5, margin: '8px 0 16px' }}>
          Choose any. We'll confirm the exact instructions over WhatsApp.
        </p>
        {PAY_METHODS.map(m => {
          const selected = state.payMethod === m.id;
          return (
            <div key={m.id} style={{
              borderRadius: 14, marginBottom: 8, overflow: 'hidden',
              border: `1.5px solid ${selected ? 'var(--ink)' : 'var(--line)'}`,
              background: selected ? '#fafafa' : '#fff',
            }}>
              <button onClick={() => set({ payMethod: m.id })} style={{
                display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                padding: '14px 14px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer',
              }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {m.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{m.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: m.id !== 'cash' ? 'JetBrains Mono, monospace' : 'inherit' }}>{m.sub}</div>
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: `1.5px solid ${selected ? 'var(--ink)' : '#d8d8d8'}`,
                  background: selected ? 'var(--ink)' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{selected && <IconCheck size={12} color="#fff" stroke={3} />}</div>
              </button>
              {selected && m.detail && (
                <div style={{ padding: '10px 14px 14px', borderTop: '1px solid var(--line)', fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.6, fontFamily: 'JetBrains Mono, monospace' }}>
                  {m.detail.map((line, i) => <div key={i}>{line}</div>)}
                </div>
              )}
            </div>
          );
        })}
        <div style={{ marginTop: 14, padding: 14, background: '#fafafa', borderRadius: 12, fontSize: 12, color: 'var(--ink-2)', display: 'flex', gap: 10 }}>
          <IconShield size={18} />
          <div>$100 deposit refunded on return. No upfront charge — pay at hand-off or via the chosen method before delivery.</div>
        </div>
      </div>
      <div style={{ padding: 16, borderTop: '1px solid var(--line)', background: '#fff' }}>
        <PrimaryButton disabled={!state.payMethod} onClick={onNext}>Continue</PrimaryButton>
      </div>
    </div>
  );
}

// ─── CONTRACT + SIGNATURE ───────────────────────────────────────────────
function SignaturePad({ value, onChange }) {
  const [mode, setMode] = React.useState('draw'); // draw | type
  const [typed, setTyped] = React.useState(value?.typed || '');
  const canvasRef = React.useRef(null);
  const drawing = React.useRef(false);
  const last = React.useRef(null);

  React.useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * dpr; c.height = rect.height * dpr;
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0a0a0a'; ctx.lineWidth = 2.2;
  }, [mode]);

  const pos = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    const t = e.touches?.[0] || e;
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  };
  const start = (e) => { e.preventDefault(); drawing.current = true; last.current = pos(e); };
  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    onChange({ mode: 'draw', drawn: true });
  };
  const end = () => { drawing.current = false; };
  const clear = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    onChange({ mode: 'draw', drawn: false });
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, padding: 4, background: '#f4f4f4', borderRadius: 10 }}>
        <button onClick={() => setMode('draw')} style={tabStyle(mode === 'draw')}>Draw</button>
        <button onClick={() => setMode('type')} style={tabStyle(mode === 'type')}>Type</button>
      </div>
      {mode === 'draw' ? (
        <div>
          <div style={{ position: 'relative', height: 140, border: '1px dashed #d8d8d8', borderRadius: 12, background: '#fff', overflow: 'hidden' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
              onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
              onTouchStart={start} onTouchMove={move} onTouchEnd={end} />
            <div style={{ position: 'absolute', left: 14, bottom: 8, fontSize: 10, color: '#bbb', letterSpacing: 1, textTransform: 'uppercase' }}>Sign here ×</div>
          </div>
          <button onClick={clear} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 12, padding: '6px 0' }}>Clear</button>
        </div>
      ) : (
        <div>
          <input value={typed} onChange={e => { setTyped(e.target.value); onChange({ mode: 'type', typed: e.target.value }); }}
            placeholder="Type your full name" style={{
              width: '100%', padding: '14px 14px', borderRadius: 12, border: '1px solid var(--line)',
              fontSize: 22, fontFamily: 'Caveat, cursive', outline: 'none', background: '#fff',
            }} />
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>By typing your name you agree it represents your handwritten signature.</div>
        </div>
      )}
    </div>
  );
}
const tabStyle = (active) => ({
  flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none',
  background: active ? '#fff' : 'transparent',
  fontSize: 12.5, fontWeight: 600, color: active ? 'var(--ink)' : 'var(--muted)',
  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
});

function ContractScreen({ state, set, onBack, onNext }) {
  const bike = BIKE_FLEET.find(b => b.id === state.bikeId);
  const fmt = (d) => d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
  const sigOk = state.signature && (state.signature.drawn || (state.signature.typed && state.signature.typed.length >= 3));
  const nights = state.startDate && state.endDate ? daysBetween(state.startDate, state.endDate) : 0;
  const phoneCC = state.phoneCC || '+505';
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <StepHeader onBack={onBack} title="Sign the contract" step={6} total={7} />
      <ProgressBar step={6} total={7} />
      <div className="phone-scroll" style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 16px' }}>
        <div style={{ padding: 16, border: '1px solid var(--line)', borderRadius: 14, background: '#fafafa' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>Rental agreement</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4, marginBottom: 12 }}>Karen & JJ Moto Rental</div>
          <ContractRow l="Renter" v={`${state.docFirstName || '—'} ${state.docLastName || ''}`} />
          <ContractRow l="Document" v={state.docNumber || '—'} mono />
          <ContractRow l="Country" v={state.docCountry || '—'} />
          <ContractRow l="Moto" v={bike ? `${bike.name} · ${bike.color}` : '—'} />
          <ContractRow l="Registration" v={bike?.plate || '—'} mono />
          <ContractRow l="Pick-up" v={fmt(state.startDate)} />
          <ContractRow l="Drop-off" v={fmt(state.endDate)} />
          <ContractRow l="Duration" v={nights ? `${nights} ${nights === 1 ? 'day' : 'days'}` : '—'} />
          <ContractRow l="Payment" v={(PAY_METHODS.find(p => p.id === state.payMethod) || {}).label || '—'} />
          <ContractRow l="WhatsApp" v={`${phoneCC} ${state.phoneNum || '—'}`} mono />
          <div style={{ height: 1, background: '#ececec', margin: '14px 0 10px' }} />
          <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>Terms & conditions</div>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>
            <li><b>Vehicle.</b> The Owner (Karen & JJ Moto Rental) rents the above motorcycle to the Renter for the dates listed. The motorcycle is delivered with a surf rack, two helmets and roadside assistance during business hours.</li>
            <li><b>Renter's responsibility.</b> The Renter accepts the motorcycle in good working condition and agrees to return it in the same condition, less normal wear. The Renter is the sole responsible operator and must hold a valid driver's license.</li>
            <li><b>Damage.</b> The Renter is responsible for any and all damage to the motorcycle, accessories or third-party property occurring during the rental period, regardless of cause or fault. The Renter agrees to compensate the Owner for the full cost of repairs.</li>
            <li><b>Loss or theft.</b> In the event of loss or theft of the motorcycle, helmets, surf rack or keys during the rental period, the Renter agrees to compensate the Owner for the <b>full market replacement value</b> of the motorcycle and any missing accessories, payable within 14 days of the incident.</li>
            <li><b>Use.</b> The motorcycle may not be ridden by anyone other than the Renter, used for racing, off-road stunts, illegal activity, or operated under the influence of alcohol or drugs. Doing so voids this agreement and shifts all liability to the Renter.</li>
            <li><b>Insurance.</b> The motorcycle carries Nicaraguan third-party liability insurance only. Personal injury, medical expenses and damage to the motorcycle itself are <b>not</b> covered. The Renter is encouraged to carry travel insurance.</li>
            <li><b>Helmets.</b> Helmets must be worn at all times by both rider and passenger, as required by Nicaraguan law.</li>
            <li><b>Deposit.</b> A refundable deposit of <b>$100 USD</b> is held at delivery and returned in full upon return of the motorcycle in the original condition.</li>
            <li><b>Late return.</b> Returns later than the agreed drop-off date will be billed at the applicable daily rate per started day.</li>
            <li><b>Termination.</b> The Owner reserves the right to terminate the rental at any time if the Renter violates any of these terms, with no refund of unused days.</li>
            <li><b>Governing law.</b> This agreement is governed by the laws of the Republic of Nicaragua. Any dispute will be resolved in the courts of Rivas Department.</li>
            <li><b>Acceptance.</b> By signing below, the Renter confirms they have read, understood and agree to all terms and conditions stated above.</li>
          </ol>
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Your signature</div>
          <SignaturePad value={state.signature} onChange={(s) => set({ signature: { ...(state.signature || {}), ...s } })} />
        </div>
      </div>
      <div style={{ padding: 16, borderTop: '1px solid var(--line)', background: '#fff' }}>
        <PrimaryButton disabled={!sigOk} onClick={onNext}>I agree & continue</PrimaryButton>
      </div>
    </div>
  );
}
function ContractRow({ l, v, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '4px 0', fontSize: 13 }}>
      <span style={{ color: 'var(--muted)' }}>{l}</span>
      <span style={{ fontWeight: 500, fontFamily: mono ? 'JetBrains Mono, monospace' : 'inherit', textAlign: 'right' }}>{v}</span>
    </div>
  );
}

// ─── DELIVERY TIME ──────────────────────────────────────────────────────
function DeliveryScreen({ state, set, onBack, onNext }) {
  const hours = Array.from({ length: 14 }, (_, i) => 7 + i); // 7..20
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <StepHeader onBack={onBack} title="Delivery time" step={7} total={7} />
      <ProgressBar step={7} total={7} />
      <div className="phone-scroll" style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 16px' }}>
        <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.5, margin: '8px 0 16px' }}>
          We'll bring the moto to your address on <b>{state.startDate ? state.startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : '—'}</b>. Pick a time between 7am and 8pm.
        </p>

        <Field label="Delivery address" value={state.deliveryAddr} onChange={v => set({ deliveryAddr: v })} placeholder="Hotel, hostel, or pin" />

        <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: 600, margin: '6px 0 10px' }}>Pick a time</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {hours.map(h => {
            const label = h === 12 ? '12:00 pm' : h < 12 ? `${h}:00 am` : `${h-12}:00 pm`;
            const sel = state.deliveryHour === h;
            return (
              <button key={h} onClick={() => set({ deliveryHour: h })} style={{
                padding: '12px 6px', borderRadius: 12,
                border: `1.5px solid ${sel ? 'var(--ink)' : 'var(--line)'}`,
                background: sel ? 'var(--ink)' : '#fff',
                color: sel ? '#fff' : 'var(--ink)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>{label}</button>
            );
          })}
        </div>
      </div>
      <div style={{ padding: 16, borderTop: '1px solid var(--line)', background: '#fff' }}>
        <PrimaryButton disabled={!state.deliveryHour || !state.deliveryAddr} onClick={onNext}>Confirm reservation</PrimaryButton>
      </div>
    </div>
  );
}

// ─── COMPLETE ───────────────────────────────────────────────────────────
function CompleteScreen({ state, onHome }) {
  const bike = BIKE_FLEET.find(b => b.id === state.bikeId);
  const ref = React.useMemo(() => 'KJ-' + Math.random().toString(36).slice(2, 6).toUpperCase() + '-' + Math.floor(Math.random()*900+100), []);
  const fmt = (d) => d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
  const hour = state.deliveryHour;
  const hourLbl = hour == null ? '—' : (hour === 12 ? '12:00 pm' : hour < 12 ? `${hour}:00 am` : `${hour-12}:00 pm`);
  const nights = state.startDate && state.endDate ? daysBetween(state.startDate, state.endDate) : 0;
  const total = nights > 0 ? state.pricing.computeTotal(nights) : 0;
  const perDay = nights > 0 ? Math.round(total / nights) : state.pricing.daily;

  return (
    <div className="phone-scroll" style={{ height: '100%', overflowY: 'auto', background: '#fff' }}>
      <div style={{ padding: '40px 24px 24px', textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', background: '#0a0a0a', color: '#fff',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
        }}><IconCheck size={34} color="#fff" stroke={3} /></div>
        <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: -0.6 }}>You're all set.</h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 8 }}>
          Karen will WhatsApp you to confirm. See you on the road.
        </p>
        <div style={{
          marginTop: 18, display: 'inline-block', padding: '8px 14px',
          background: '#fafafa', border: '1px solid var(--line)', borderRadius: 999,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 500,
        }}>RES · {ref}</div>
      </div>

      <div style={{ padding: '0 16px' }}>
        <div style={{ border: '1px solid var(--line)', borderRadius: 16, padding: 18 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>Reservation details</div>
          <ContractRow l="Renter" v={`${state.docFirstName} ${state.docLastName}`} />
          <ContractRow l="Moto" v={bike ? `${bike.name} · ${bike.color}` : '—'} />
          <ContractRow l="Registration" v={bike?.plate || '—'} mono />
          <ContractRow l="Pick-up" v={`${fmt(state.startDate)} · ${hourLbl}`} />
          <ContractRow l="Drop-off" v={fmt(state.endDate)} />
          <ContractRow l="Days" v={`${nights}`} />
          <ContractRow l="Address" v={state.deliveryAddr || '—'} />
          <ContractRow l="Payment" v={(PAY_METHODS.find(p => p.id === state.payMethod) || {}).label || '—'} />
          <ContractRow l="WhatsApp" v={`${state.phoneCC} ${state.phoneNum}`} mono />
          <div style={{ height: 1, background: '#ececec', margin: '12px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Total estimate</span>
            <span style={{ fontSize: 20, fontWeight: 700 }}>${total}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <a href={`https://wa.me/50589750052?text=Hi%2C%20I%20just%20booked%20${ref}`} target="_blank" rel="noreferrer" style={footerLinkStyle('#25D366')}>
            <IconChat size={18} color="#fff" /><span>Message Karen</span>
          </a>
        </div>

        <button onClick={onHome} style={{
          marginTop: 12, width: '100%', padding: 14, borderRadius: 14, border: '1px solid var(--line)',
          background: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 24,
        }}>Back to home</button>
      </div>
    </div>
  );
}

Object.assign(window, {
  CalendarScreen, BikePickScreen, OCRScreen, PhoneScreen,
  PaymentScreen, ContractScreen, DeliveryScreen, CompleteScreen,
  daysBetween,
});
