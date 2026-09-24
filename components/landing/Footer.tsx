"use client";

import { useSettings } from "@/modules/settings/hooks/useSettings";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { navLinks } from "@/lib/landing/nav-links";
import { BallGlyph } from "@/components/landing/icons";

export function Footer() {
  const { data: settingsData } = useSettings();
  const siteName = settingsData?.data?.name ?? "Liga de Futbol";
  const slogan = settingsData?.data?.slogan;
  const { t } = useLocale();
  const links = navLinks(t);

  return (
    <footer className="relative overflow-hidden border-t border-border bg-surface">
      <BallGlyph className="pointer-events-none absolute -bottom-16 -right-16 -z-10 h-56 w-56 text-ink/[0.03] dark:text-white/[0.04]" />

      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-4 px-4 py-10 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left">
        <div>
          <p className="text-sm font-black uppercase tracking-tight text-ink dark:text-white">
            {siteName} · {new Date().getFullYear()}
          </p>
          <p className="mt-1 text-xs text-muted dark:text-white/40">{slogan || t.footer.defaultSlogan}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-bold uppercase tracking-widest">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="text-muted hover:text-primary dark:text-white/50 ">
              {link.label}
            </a>
          ))}
        </div>
      </div>
      <p className="border-t border-border py-4 text-center text-[11px] text-muted dark:border-white/5 dark:text-white/30">
        © {new Date().getFullYear()} {siteName}. {t.footer.rights}
      </p>
    </footer>
  );
}
