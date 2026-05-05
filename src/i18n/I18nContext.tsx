import React from "react";
import {
  Locale,
  detectLocale,
  persistLocale,
  translate,
  localeForIntl,
} from "./index";

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  intlLocale: string;
}

const I18nContext = React.createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>(() => detectLocale());
  const setLocale = React.useCallback((l: Locale) => {
    persistLocale(l);
    setLocaleState(l);
  }, []);
  const t = React.useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      translate(locale, key, vars),
    [locale]
  );
  const intlLocale = localeForIntl(locale);
  const value = React.useMemo(
    () => ({ locale, setLocale, t, intlLocale }),
    [locale, setLocale, t, intlLocale]
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
