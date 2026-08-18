"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, LoaderCircle } from "lucide-react";
import { useSettings, siteLogoUrl } from "@/hooks/useSettings";
import { BrandPanel } from "@/components/auth/brand-panel";

export function AuthShell({
  backLink,
  children,
}: {
  backLink: { href: string; label: string };
  children: ReactNode;
}) {
  const { data: settingsData } = useSettings();
  const siteName = settingsData?.data?.name ?? "Liga de Futbol";
  const logoUrl = siteLogoUrl(settingsData?.data);

  return (
    <div className="flex h-screen justify-center overflow-hidden p-2.5 sm:p-5">
      <div className="flex w-full max-w-[960px] overflow-hidden rounded-[28px] border border-border bg-surface/60 shadow-[0_40px_80px_-40px_rgba(15,23,42,0.4)] backdrop-blur-sm dark:shadow-[0_40px_80px_-40px_rgba(0,0,0,0.8)]">
        <BrandPanel logoUrl={logoUrl} siteName={siteName} />

        <div className="flex w-full flex-1 items-center justify-center bg-gradient-to-br from-surface via-surface to-primary-light/40 p-6 sm:p-10">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-11 w-11 shrink-0 rounded-full border-2 border-primary bg-white object-cover p-1"
                />
              ) : (
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary-light text-xl">
                  <LoaderCircle className="animate-spin" size={24} />
                </span>
              )}
              <span className="text-lg font-black uppercase tracking-tight text-ink">{siteName}</span>
            </div>

            <Link href={backLink.href} className="fixed top-5 right-5 hover:scale-105 transition-all duration-300">
              <span className="flex items-center gap-2">
                <ChevronLeft />
                {backLink.label}
              </span>
            </Link>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
