"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, MapPinned, Trophy } from "lucide-react";
import type { Match } from "@/modules/matches/hooks/useMatches";
import type { Team } from "@/modules/teams/hooks/useTeams";
import type { Field } from "@/modules/fields/hooks/useFields";
import { teamPhotoUrl } from "@/modules/teams/hooks/useTeams";
import { Avatar } from "@/components/ui/avatar";
import { CategoryBadge } from "@/components/ui/category-badge";
import { formatCalendarDate } from "@/lib/utils/date";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { FieldLink } from "@/components/landing/FieldLink";
import { CornerFlagGlyph } from "@/components/landing/icons";

export function HeroSection({
  upcoming,
  teamsById,
  fieldsById,
  dateLocale,
  playedCount,
}: {
  upcoming: Match[];
  teamsById: Record<string, Team>;
  fieldsById: Record<string, Field>;
  dateLocale: string;
  playedCount: number;
}) {
  const { t } = useLocale();
  const [heroIndex, setHeroIndex] = useState(0);
  const featured = upcoming[heroIndex] ?? null;
  const dotCount = Math.min(upcoming.length, 8);

  const goPrev = () => setHeroIndex((i) => (i - 1 + upcoming.length) % upcoming.length);
  const goNext = () => setHeroIndex((i) => (i + 1) % upcoming.length);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-light via-surface to-background text-ink">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 75% 20%, color-mix(in srgb, var(--color-primary) 14%, transparent), transparent 55%)",
        }}
      />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-4 pb-8 pt-5 sm:px-6 sm:pt-20">
        {/* Player 2 */}
        <div
          className="pointer-events-none absolute bottom-20 right-10 z-10 hidden w-[220px] sm:block sm:w-[260px] md:w-[300px] lg:w-[280px]"
          style={{
            maskImage: "linear-gradient(to left, black 40%, transparent 96%)",
            WebkitMaskImage: "linear-gradient(to left, black 40%, transparent 96%)",
          }}
        >
          <Image
            src="/images/player-kicking.webp"
            alt=""
            width={548}
            height={858}
            priority
            className="h-auto w-full opacity-90"
          />
        </div>

        {/* Player 1 */}
        <div
          className="pointer-events-none absolute bottom-22 left-20 z-10 hidden w-[220px] sm:block sm:w-[260px] md:w-[300px] lg:w-[300px]"
          style={{
            maskImage: "linear-gradient(to right, black 40%, transparent 96%)",
            WebkitMaskImage: "linear-gradient(to right, black 40%, transparent 96%)",
          }}
        >
          <Image
            src="/images/player-heading.webp"
            alt=""
            width={548}
            height={858}
            priority
            className="h-auto w-full opacity-90"
          />
        </div>

        {/* Giant ghost number */}
        <span
          key={`ghost-${heroIndex}`}
          aria-hidden
          className="pointer-events-none absolute -top-6 right-0 z-0 select-none text-[9rem] font-black leading-none text-ink/[0.04] [animation:fade-in-up_0.4s_ease] dark:text-white/[0.05] sm:text-[16rem]"
        >
          {featured ? t.hero.ghostMatchday(featured.matchday) : new Date().getFullYear()}
        </span>

        <div className="relative z-10 flex items-center gap-2 sm:gap-4">
          {upcoming.length > 1 && (
            <button
              type="button"
              onClick={goPrev}
              aria-label={t.hero.prevMatch}
              className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full  border-2 border-gray-400 text-muted transition-colors hover:border-primary hover:text-primary dark:border-white/15 dark:text-white/60 sm:flex hover:scale-110 transition-transform duration-200"
            >
              <ChevronLeft size={20} className="text-gray-400 dark:text-white hover:text-primary" />
            </button>
          )}

          <div key={heroIndex} className="flex-1 py-3 text-center [animation:fade-in-up_0.4s_ease] sm:py-12">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-light px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary ">
              <Trophy size={12} /> {featured ? t.hero.nextMatchBadge(featured.matchday) : t.hero.seasonBadge(new Date().getFullYear())}
            </span>

            {featured ? (
              <>
                <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
                  <div className="flex flex-col items-center gap-3 px-2 hover:scale-110 transition-transform duration-200">
                    <Avatar
                      src={teamsById[featured.homeTeamId] ? teamPhotoUrl(teamsById[featured.homeTeamId]) : null}
                      name={teamsById[featured.homeTeamId]?.name ?? "?"}
                      size={72}
                    />
                    <span className="max-w-[13rem] text-balance text-lg font-black leading-tight tracking-tight text-ink dark:text-white sm:max-w-[16rem] sm:text-2xl">
                      {teamsById[featured.homeTeamId]?.name ?? "—"}
                    </span>
                  </div>
                  <span className="text-sm font-black uppercase tracking-widest text-muted dark:text-white/30 sm:text-base">{t.hero.vs}</span>
                  <div className="flex flex-col items-center gap-3 px-2 hover:scale-110 transition-transform duration-200">
                    <Avatar
                      src={teamsById[featured.awayTeamId] ? teamPhotoUrl(teamsById[featured.awayTeamId]) : null}
                      name={teamsById[featured.awayTeamId]?.name ?? "?"}
                      size={72}
                    />
                    <span className="max-w-[13rem] text-balance text-lg font-black leading-tight tracking-tight text-ink dark:text-white sm:max-w-[16rem] sm:text-2xl">
                      {teamsById[featured.awayTeamId]?.name ?? "—"}
                    </span>
                  </div>
                </div>

                <div className="mt-8 flex flex-col items-center gap-1 text-muted dark:text-white/70">
                  <span className="text-sm font-semibold">
                    {formatCalendarDate(
                      featured.date,
                      {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                      },
                      dateLocale
                    )}{" "}
                    · {featured.time ?? t.hero.timeTbd}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted dark:text-white/40">
                    <MapPinned size={13} />
                    <FieldLink
                      location={fieldsById[featured.fieldId]?.location}
                      name={fieldsById[featured.fieldId]?.name ?? t.upcoming.fieldTbd}
                    />
                  </span>
                  <CategoryBadge category={featured.category} />
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <a
                    href="#proximos-partidos"
                    className="rounded-full bg-primary px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-primary-hover"
                  >
                    {t.hero.viewCalendar}
                  </a>
                  <a
                    href="#tabla"
                    className="rounded-full border border-border px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-ink transition-colors hover:border-slate-900 hover:text-ink dark:border-white/25 dark:text-white dark:hover:border-white"
                  >
                    {t.hero.viewTable}
                  </a>
                </div>
              </>
            ) : (
              <>
                <h1 className="mx-auto mt-6 max-w-xl text-3xl font-black tracking-tight text-ink dark:text-white sm:text-5xl">
                  {t.hero.noMatchesTitle}
                </h1>
                <p className="mx-auto mt-3 max-w-md text-sm text-muted dark:text-white/50">
                  {t.hero.noMatchesBody}
                </p>
                <div className="mt-8">
                  <a
                    href="#tabla"
                    className="rounded-full bg-primary px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-primary-hover"
                  >
                    {t.hero.viewStandings}
                  </a>
                </div>
              </>
            )}
          </div>

          {upcoming.length > 1 && (
            <button
              type="button"
              onClick={goNext}
              aria-label={t.hero.nextMatch}
              className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-gray-400 text-muted transition-colors hover:border-primary hover:text-primary dark:border-white/15 dark:text-white/60 sm:flex hover:scale-110 transition-transform duration-200"
            >
              <ChevronRight size={20} className="text-gray-400 dark:text-white hover:text-primary" />
            </button>
          )}
        </div>

        {/* Quick links */}
        <div className="relative z-10 mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 border-t border-border pt-6 text-[11px] font-bold uppercase tracking-widest dark:border-white/10 sm:justify-start">
          <a
            href="#proximos-partidos"
            className="flex items-center gap-1.5 text-muted transition-colors hover:text-primary dark:text-white/50 "
          >
            <CornerFlagGlyph className="h-3 w-3" /> {t.hero.quickCalendar}
          </a>
          <a
            href="#tabla"
            className="flex items-center gap-1.5 text-muted transition-colors hover:text-primary dark:text-white/50 "
          >
            <CornerFlagGlyph className="h-3 w-3" /> {t.hero.quickTable}
          </a>
          <a
            href="#equipos"
            className="flex items-center gap-1.5 text-muted transition-colors hover:text-primary dark:text-white/50 "
          >
            <CornerFlagGlyph className="h-3 w-3" /> {t.hero.quickTeams}
          </a>
          <a
            href="#partidos-jugados"
            className="flex items-center gap-1.5 text-muted transition-colors hover:text-primary dark:text-white/50 "
          >
            <CornerFlagGlyph className="h-3 w-3" /> {t.hero.matchesPlayed(playedCount)}
          </a>
        </div>
      </div>

      {/* Bottom carousel strip */}
      {upcoming.length > 1 && (
        <div className="relative z-10 border-t border-border bg-slate-100/70 dark:border-white/10 dark:bg-black/30">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 text-xs font-bold uppercase tracking-widest sm:px-6">
            <button
              type="button"
              onClick={goPrev}
              className="flex items-center gap-1.5 text-muted transition-colors hover:text-primary dark:text-white/50 "
            >
              <ChevronLeft size={14} />
              <span className="hidden sm:inline">
                {teamsById[upcoming[(heroIndex - 1 + upcoming.length) % upcoming.length].homeTeamId]?.name ?? "—"}
              </span>
            </button>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: dotCount }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setHeroIndex(i)}
                  aria-label={t.hero.viewMatchN(i + 1)}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${i === heroIndex % dotCount ? "bg-primary " : "bg-slate-300 dark:bg-white/20"
                    }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={goNext}
              className="flex items-center gap-1.5 text-muted transition-colors hover:text-primary dark:text-white/50 "
            >
              <span className="hidden sm:inline">
                {teamsById[upcoming[(heroIndex + 1) % upcoming.length].homeTeamId]?.name ?? "—"}
              </span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
