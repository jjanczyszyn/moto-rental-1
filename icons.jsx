// Inline SVG icons. Original geometry, no third-party brand marks.

const Icon = ({ children, size = 20, color = 'currentColor', stroke = 1.8, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const IconChevronLeft = (p) => <Icon {...p}><path d="M15 18l-6-6 6-6" /></Icon>;
const IconChevronRight = (p) => <Icon {...p}><path d="M9 6l6 6-6 6" /></Icon>;
const IconClose = (p) => <Icon {...p}><path d="M6 6l12 12M18 6L6 18" /></Icon>;
const IconCheck = (p) => <Icon {...p}><path d="M5 12.5l4.5 4.5L19 7" /></Icon>;
const IconStar = ({ size = 14, color = '#ff5a3c' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M12 2.5l2.9 6.3 6.9.7-5.2 4.7 1.5 6.8L12 17.6 5.9 21l1.5-6.8L2.2 9.5l6.9-.7L12 2.5z" />
  </svg>
);
const IconSurfboard = (p) => <Icon {...p}><path d="M12 3c4 4 5 11 0 18-5-7-4-14 0-18z" /><path d="M12 9v8" /></Icon>;
const IconHelmet = (p) => <Icon {...p}><path d="M4 14a8 8 0 0 1 16 0v3H4z" /><path d="M9 14V9" /><path d="M4 17h16" /></Icon>;
const IconTruck = (p) => <Icon {...p}><path d="M3 7h11v9H3z" /><path d="M14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" /></Icon>;
const IconCalendar = (p) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></Icon>;
const IconUpload = (p) => <Icon {...p}><path d="M12 16V4" /><path d="M7 9l5-5 5 5" /><path d="M5 20h14" /></Icon>;
const IconCamera = (p) => <Icon {...p}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></Icon>;
const IconCash = (p) => <Icon {...p}><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 9v6M18 9v6" /></Icon>;
const IconBank = (p) => <Icon {...p}><path d="M3 10l9-6 9 6" /><path d="M5 10v8M19 10v8M9 10v8M15 10v8" /><path d="M3 20h18" /></Icon>;
const IconLocation = (p) => <Icon {...p}><path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z" /><circle cx="12" cy="9" r="2.5" /></Icon>;
// Stylized chat bubble for whatsapp-style action (original geometry, no logo)
const IconChat = (p) => <Icon {...p}><path d="M21 12a8 8 0 1 1-3.2-6.4L21 4l-1.4 3.5A8 8 0 0 1 21 12z" /><path d="M8 12h.01M12 12h.01M16 12h.01" stroke="currentColor" strokeWidth="2" /></Icon>;
const IconMap = (p) => <Icon {...p}><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></Icon>;
const IconMoto = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5.5" cy="16" r="3" />
    <circle cx="18.5" cy="16" r="3" />
    <path d="M5.5 16h6l4-6h3" />
    <path d="M14 10l-2-3h-3" />
    <path d="M18.5 10v3" />
  </svg>
);
const IconShield = (p) => <Icon {...p}><path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" /></Icon>;
const IconArrowRight = (p) => <Icon {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>;
const IconRefresh = (p) => <Icon {...p}><path d="M4 12a8 8 0 0 1 14-5.3L20 9" /><path d="M20 4v5h-5" /><path d="M20 12a8 8 0 0 1-14 5.3L4 15" /><path d="M4 20v-5h5" /></Icon>;

Object.assign(window, {
  Icon, IconChevronLeft, IconChevronRight, IconClose, IconCheck, IconStar,
  IconSurfboard, IconHelmet, IconTruck, IconCalendar, IconUpload, IconCamera,
  IconCash, IconBank, IconLocation, IconChat, IconMap, IconMoto, IconShield,
  IconArrowRight, IconRefresh,
});
