import React from "react";
import { IconChevronLeft } from "./Icons";

export function StepHeader({
  onBack,
  title,
  step,
  total,
}: {
  onBack: () => void;
  title: string;
  step?: number;
  total?: number;
}) {
  return (
    <div style={{ padding: "12px 16px 8px", display: "flex", alignItems: "center", gap: 8 }}>
      <button onClick={onBack} style={{
        width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--line)",
        background: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}><IconChevronLeft size={18} /></button>
      <div style={{ flex: 1 }}>
        {step != null && (
          <div style={{ fontSize: 10.5, color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>
            Step {step} of {total}
          </div>
        )}
        <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{title}</div>
      </div>
    </div>
  );
}

export function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ height: 3, background: "#f0f0f0", margin: "0 16px", borderRadius: 2, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${(step / total) * 100}%`, background: "var(--ink)", transition: "width .3s" }} />
    </div>
  );
}

export function PrimaryButton({
  onClick,
  children,
  disabled,
}: {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: "100%", padding: "15px 20px", borderRadius: 14, border: "none",
      background: disabled ? "#cfcfcf" : "var(--ink)", color: "#fff",
      fontSize: 15, fontWeight: 600, display: "inline-flex",
      alignItems: "center", justifyContent: "center", gap: 8,
      opacity: disabled ? 0.7 : 1, cursor: disabled ? "not-allowed" : "pointer",
    }}>
      {children}
    </button>
  );
}

export function Field({
  label,
  value,
  onChange,
  mono,
  placeholder,
  type = "text",
  inputStyle,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  mono?: boolean;
  placeholder?: string;
  type?: string;
  inputStyle?: React.CSSProperties;
}) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 0.6, textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <input
        type={type}
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => (e.target.style.borderColor = "var(--ink)")}
        onBlur={(e) => (e.target.style.borderColor = "var(--line)")}
        style={{
          width: "100%",
          padding: "13px 14px",
          borderRadius: 12,
          border: "1px solid var(--line)",
          fontSize: 15,
          background: "#fff",
          outline: "none",
          fontFamily: mono ? "JetBrains Mono, monospace" : "inherit",
          ...(inputStyle || {}),
        }}
      />
    </label>
  );
}

export function ContractRow({ l, v, mono }: { l: string; v: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "4px 0", fontSize: 13 }}>
      <span style={{ color: "var(--muted)" }}>{l}</span>
      <span style={{ fontWeight: 500, fontFamily: mono ? "JetBrains Mono, monospace" : "inherit", textAlign: "right" }}>{v}</span>
    </div>
  );
}

export function StarsRow({ count = 5, size = 13 }: { count?: number; size?: number }) {
  return (
    <div style={{ display: "inline-flex", gap: 2 }}>
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill="#ff5a3c" aria-hidden="true">
          <path d="M12 2.5l2.9 6.3 6.9.7-5.2 4.7 1.5 6.8L12 17.6 5.9 21l1.5-6.8L2.2 9.5l6.9-.7L12 2.5z" />
        </svg>
      ))}
    </div>
  );
}

export function daysBetween(a: Date | null, b: Date | null): number {
  if (!a || !b) return 0;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function sameDay(a: Date | null, b: Date | null): boolean {
  return !!(a && b && a.toDateString() === b.toDateString());
}
