import React from "react";
import { assetUrl } from "../lib/assets";

export type BikeRow = {
  _id: string;
  slug: string;
  name: string;
  color: string;
  type: "Electric" | "Gas";
  plate: string;
  range: string;
  image: string;
  isActive: boolean;
};

// Visual styling by slug — kept on the client to match the prototype.
const STYLE_BY_SLUG: Record<string, { accent: string; body: string; seat: string }> = {
  "genesis-red":  { accent: "#e23d2c", body: "#cf2e1f", seat: "#1a1a1a" },
  "genesis-blue": { accent: "#2a6bd1", body: "#1f56b0", seat: "#1a1a1a" },
  "yamaha-xt":    { accent: "#222222", body: "#f4f4f4", seat: "#1a1a1a" },
};

export function bikeStyle(slug: string) {
  return STYLE_BY_SLUG[slug] ?? { accent: "#ff5a3c", body: "#1a1a1a", seat: "#1a1a1a" };
}

export function BikeIllustration({
  accent = "#ff5a3c",
  seat = "#1a1a1a",
  height = 130,
  label = "moto",
  image,
}: {
  accent?: string;
  body?: string;
  seat?: string;
  height?: number;
  label?: string;
  image?: string | null;
}) {
  if (image) {
    return (
      <div style={{ width: "100%", height, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img src={assetUrl(image)} alt={label} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
      </div>
    );
  }
  const id = `g-${accent.replace("#", "")}`;
  return (
    <svg viewBox="0 0 320 160" width="100%" height={height} role="img" aria-label={label} style={{ display: "block" }}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={accent} stopOpacity="0.95" />
          <stop offset="1" stopColor={accent} stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <line x1="10" y1="135" x2="310" y2="135" stroke="#e6e6e6" strokeDasharray="2 4" />
      <g>
        <rect x="120" y="42" width="120" height="6" rx="2" fill="#0a0a0a" />
        <rect x="135" y="32" width="90" height="14" rx="3" fill={accent} opacity="0.85" />
      </g>
      <path d="M70 110 L130 80 L210 80 L240 70 L255 100 L220 110 L160 115 L110 115 Z"
            fill={`url(#${id})`} stroke="#0a0a0a" strokeWidth="1.5" />
      <path d="M150 82 L200 82 L195 95 L155 95 Z" fill="#fff" opacity="0.18" />
      <path d="M195 78 L240 70 L245 80 L200 86 Z" fill={seat} />
      <path d="M105 65 L122 80" stroke="#0a0a0a" strokeWidth="3" strokeLinecap="round" />
      <path d="M99 60 L115 60" stroke="#0a0a0a" strokeWidth="3" strokeLinecap="round" />
      <circle cx="100" cy="70" r="6" fill="#0a0a0a" />
      <circle cx="100" cy="70" r="3" fill="#fff48f" />
      <rect x="225" y="105" width="40" height="5" rx="2" fill="#9a9a9a" />
      <circle cx="80" cy="120" r="22" fill="#0a0a0a" />
      <circle cx="80" cy="120" r="10" fill="none" stroke="#3a3a3a" strokeWidth="1.5" />
      <circle cx="80" cy="120" r="4" fill="#5a5a5a" />
      <circle cx="240" cy="120" r="22" fill="#0a0a0a" />
      <circle cx="240" cy="120" r="10" fill="none" stroke="#3a3a3a" strokeWidth="1.5" />
      <circle cx="240" cy="120" r="4" fill="#5a5a5a" />
    </svg>
  );
}
