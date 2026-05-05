import React from "react";
import { useI18n } from "../i18n/I18nContext";
import type { Locale } from "../i18n";

const OPTIONS: { locale: Locale; flag: string; label: string }[] = [
  { locale: "en", flag: "🇺🇸", label: "EN" },
  { locale: "es", flag: "🇪🇸", label: "ES" },
];

// Two flag chips. Tap to switch — choice is remembered in localStorage so
// the page boots in the customer's preferred language next time.
export function LocaleSwitcher({
  size = "compact",
}: {
  size?: "compact" | "comfortable";
}) {
  const { locale, setLocale } = useI18n();
  const padY = size === "compact" ? 4 : 6;
  const padX = size === "compact" ? 8 : 10;
  return (
    <div
      role="group"
      aria-label="Language"
      style={{
        display: "inline-flex",
        gap: 4,
        padding: 3,
        background: "#fafafa",
        border: "1px solid var(--line)",
        borderRadius: 999,
      }}
    >
      {OPTIONS.map((o) => {
        const active = locale === o.locale;
        return (
          <button
            key={o.locale}
            type="button"
            onClick={() => setLocale(o.locale)}
            aria-pressed={active}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: `${padY}px ${padX}px`,
              borderRadius: 999,
              border: "none",
              background: active ? "var(--ink)" : "transparent",
              color: active ? "#fff" : "var(--ink-2)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 0.4,
              cursor: "pointer",
            }}
          >
            <span
              style={{
                fontSize: 14,
                lineHeight: 1,
                fontFamily:
                  '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif',
              }}
              aria-hidden
            >
              {o.flag}
            </span>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
