"use client";

import { createContext, useContext, type ReactNode } from "react";
import { dictionaries, type Locale } from "@/lib/i18n/dictionaries";

interface LocaleContextValue {
  locale: Locale;
  t: (typeof dictionaries)["es-MX"];
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

// The site's language is a single admin-controlled setting (SiteSettings.locale)
// — every visitor sees the same one, there's no per-viewer override anymore.
export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={{ locale, t: dictionaries[locale] }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}
