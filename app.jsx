// Main app: state, screen routing, Tweaks panel.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dailyRate": 20,
  "weeklyRate": 120,
  "monthlyRate": 450,
  "accent": "#ff5a3c",
  "ctaLabel": "Rent a motorcycle",
  "showReviews": true
}/*EDITMODE-END*/;

const SCREENS = ['home', 'calendar', 'bike', 'ocr', 'phone', 'pay', 'contract', 'delivery', 'done'];

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply accent to CSS var
  React.useEffect(() => {
    document.documentElement.style.setProperty('--accent', tweaks.accent);
  }, [tweaks.accent]);

  const [screen, setScreen] = React.useState('home');
  const [state, setState] = React.useState({
    startDate: null, endDate: null,
    bikeId: null,
    docFirstName: '', docLastName: '', docNumber: '', docExpiry: '', docCountry: '',
    phoneCC: '+505', phoneCustomCC: '', phoneNum: '', phoneNote: '',
    payMethod: null,
    signature: null,
    deliveryAddr: '', deliveryHour: null,
  });
  const set = (patch) => setState(s => ({ ...s, ...patch }));

  const pricing = {
    daily: tweaks.dailyRate,
    weekly: tweaks.weeklyRate,
    monthly: tweaks.monthlyRate,
  };
  // Pricing rule: extra days BEYOND a full week/month are billed at the
  // prorated weekly/monthly day-rate (not the full daily rate). Optimal
  // bundle of months + weeks + (prorated weekly per-diem) for leftover days.
  pricing.computeTotal = (n) => {
    if (!n || n < 1) return 0;
    if (n < 7) return n * pricing.daily;
    let best = Infinity;
    for (let m = 0; m <= Math.floor(n / 30) + 1; m++) {
      const afterMonths = n - m * 30;
      if (afterMonths < 0) continue;
      // Direct daily on the remainder, OR weeks-plus-prorated-weekly-leftover
      const directDaily = m * pricing.monthly + afterMonths * pricing.daily;
      if (directDaily < best) best = directDaily;
      for (let w = 1; w <= Math.floor(afterMonths / 7) + 1; w++) {
        const leftover = afterMonths - w * 7;
        if (leftover < 0) continue;
        // leftover days billed at weekly per-diem (120/7), not full daily
        const cost = m * pricing.monthly + w * pricing.weekly + leftover * (pricing.weekly / 7);
        if (cost < best) best = cost;
      }
      // monthly per-diem for leftover after months (e.g. 35 days → 30 + 5×monthly/30)
      if (m > 0) {
        const monthlyProrated = m * pricing.monthly + afterMonths * (pricing.monthly / 30);
        if (monthlyProrated < best) best = monthlyProrated;
      }
    }
    return Math.round(best);
  };
  pricing.perDay = (n) => n > 0 ? pricing.computeTotal(n) / n : pricing.daily;
  const stateWithPricing = { ...state, pricing };

  const go = (s) => setScreen(s);
  const next = () => { const i = SCREENS.indexOf(screen); if (i < SCREENS.length - 1) go(SCREENS[i + 1]); };
  const back = () => { const i = SCREENS.indexOf(screen); if (i > 0) go(SCREENS[i - 1]); };

  const reset = () => {
    setState({
      startDate: null, endDate: null, bikeId: null,
      docFirstName: '', docLastName: '', docNumber: '', docExpiry: '', docCountry: '',
      phoneCC: '+505', phoneCustomCC: '', phoneNum: '', phoneNote: '', payMethod: null, signature: null,
      deliveryAddr: '', deliveryHour: null,
    });
    go('home');
  };

  let content;
  switch (screen) {
    case 'home':
      content = (
        <HomeScreen onStart={() => go('calendar')} pricing={pricing} ctaLabel={tweaks.ctaLabel} />
      );
      break;
    case 'calendar': content = <CalendarScreen state={stateWithPricing} set={set} onBack={() => go('home')} onNext={next} />; break;
    case 'bike':     content = <BikePickScreen state={stateWithPricing} set={set} onBack={back} onNext={next} />; break;
    case 'ocr':      content = <OCRScreen state={state} set={set} onBack={back} onNext={next} />; break;
    case 'phone':    content = <PhoneScreen state={state} set={set} onBack={back} onNext={next} />; break;
    case 'pay':      content = <PaymentScreen state={state} set={set} onBack={back} onNext={next} />; break;
    case 'contract': content = <ContractScreen state={state} set={set} onBack={back} onNext={next} />; break;
    case 'delivery': content = <DeliveryScreen state={state} set={set} onBack={back} onNext={next} />; break;
    case 'done':     content = <CompleteScreen state={stateWithPricing} onHome={reset} />; break;
    default: content = null;
  }

  // Responsive: render full-bleed on real mobile, framed on desktop/tablet.
  const [isMobile, setIsMobile] = React.useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches
  );
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 700px)');
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <>
      {isMobile ? (
        <div style={{
          width: '100%', height: '100vh', height: '100dvh',
          background: '#fff', position: 'relative', overflow: 'hidden',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
            {content}
          </div>
        </div>
      ) : (
        <IOSDevice width={402} height={874}>
          <div style={{ height: '100%', background: '#fff', position: 'relative', overflow: 'hidden', paddingTop: 54 }}>
            {content}
          </div>
        </IOSDevice>
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Pricing (backend-configurable)">
          <TweakNumber label="Daily rate ($)" value={tweaks.dailyRate} onChange={v => setTweak('dailyRate', v)} min={1} max={200} />
          <TweakNumber label="Weekly rate ($)" value={tweaks.weeklyRate} onChange={v => setTweak('weeklyRate', v)} min={1} max={2000} />
          <TweakNumber label="Monthly rate ($)" value={tweaks.monthlyRate} onChange={v => setTweak('monthlyRate', v)} min={1} max={6000} />
        </TweakSection>
        <TweakSection label="Brand">
          <TweakColor label="Accent color" value={tweaks.accent} onChange={v => setTweak('accent', v)} />
          <TweakText label="CTA label" value={tweaks.ctaLabel} onChange={v => setTweak('ctaLabel', v)} />
        </TweakSection>
        <TweakSection label="Jump to screen">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {SCREENS.map(s => (
              <button key={s} onClick={() => go(s)} style={{
                padding: '8px 4px', borderRadius: 8, border: '1px solid #2a2a2a',
                background: screen === s ? '#fff' : 'transparent',
                color: screen === s ? '#000' : '#ddd', fontSize: 11, fontWeight: 600,
                textTransform: 'capitalize', cursor: 'pointer',
              }}>{s}</button>
            ))}
          </div>
        </TweakSection>
        <TweakSection label="Quick fill">
          <TweakButton label="Pre-fill all fields" onClick={() => {
            const s = new Date(); s.setDate(s.getDate() + 3);
            const e = new Date(); e.setDate(e.getDate() + 10);
            set({
              startDate: s, endDate: e, bikeId: 'genesis-red',
              docFirstName: 'Alex', docLastName: 'Morales Ruiz', docNumber: 'X37491820', docExpiry: '2031-08-14', docCountry: 'United States',
              phoneCC: '+1', phoneNum: '415 555 0102',
              payMethod: 'wise', deliveryAddr: 'Buena Vista Surf Club, Guasacate', deliveryHour: 10,
              signature: { mode: 'type', typed: 'Alex Morales' },
            });
          }} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
