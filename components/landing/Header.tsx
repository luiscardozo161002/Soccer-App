"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useSettings, siteLogoUrl } from "@/modules/settings/hooks/useSettings";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { navLinks } from "@/lib/landing/nav-links";

export function Header() {
  const [open, setOpen] = useState(false);
  const { data: settingsData } = useSettings();
  const siteName = settingsData?.data?.name ?? "LigA Futbolera";
  const logoUrl = siteLogoUrl(settingsData?.data);
  const { t } = useLocale();
  const links = navLinks(t);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-4 sm:px-6">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
          className="text-ink dark:text-white sm:hidden"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className="flex items-center gap-2">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
          )}
          <span className="text-lg font-black uppercase tracking-tight text-ink dark:text-white">{siteName}</span>
        </div>

        <nav className="ml-10 hidden flex-1 items-center gap-8 text-xs font-bold uppercase tracking-widest sm:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-muted transition-colors hover:text-ink dark:text-white/60 dark:hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <Link
            href="/admin"
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/30 dark:text-white hover:scale-105 transition-all duration-300 "
          >
            {t.nav.portal}
          </Link>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-border px-4 py-3 dark:border-white/10 sm:hidden">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-2.5 text-sm font-bold uppercase tracking-wide text-muted hover:bg-slate-100 hover:text-ink dark:text-white/70 dark:hover:bg-white/5 dark:hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
