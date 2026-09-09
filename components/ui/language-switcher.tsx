"use client";

import { useLocale } from "@/lib/i18n/LocaleContext";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="flex shrink-0 items-center rounded-full border border-border p-0.5 text-[11px] font-bold uppercase tracking-widest dark:border-white/30">
      <button
        type="button"
        onClick={() => setLocale("es-MX")}
        aria-pressed={locale === "es-MX"}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          locale === "es-MX"
            ? "bg-primary text-white"
            : "text-muted hover:text-ink dark:text-white/60 dark:hover:text-white"
        }`}
      >
        ES
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          locale === "en"
            ? "bg-primary text-white"
            : "text-muted hover:text-ink dark:text-white/60 dark:hover:text-white"
        }`}
      >
        EN
      </button>
    </div>
  );
}
