"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Trophy,
  ShieldCheck,
  CalendarDays,
  MapPinned,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { useStandings } from "@/hooks/useStandings";
import { useTeams, teamPhotoUrl } from "@/hooks/useTeams";
import { useMatches } from "@/hooks/useMatches";
import { useFields, googleMapsUrl } from "@/hooks/useFields";
import { useSettings, siteLogoUrl } from "@/hooks/useSettings";
import { formatCalendarDate } from "@/lib/date";
import { LEAGUE_CATEGORIES } from "@/lib/constants/league-categories";
import { Avatar } from "@/components/ui/avatar";
import { CategoryBadge, CategoryDot } from "@/components/ui/category-badge";
import { ThemeToggle } from "@/components/theme-toggle";

const navLinks = [
  { href: "#proximos-partidos", label: "Próximos partidos" },
  { href: "#tabla", label: "Tabla" },
  { href: "#equipos", label: "Equipos" },
];

// Scroll-reveal: sections fade/slide into place the first time they enter
// the viewport, instead of just appearing.
const sectionReveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
} as const;

function BallGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="0.6">
      <circle cx="50" cy="50" r="48" />
      <polygon points="50,24 63,33 58,48 42,48 37,33" fill="currentColor" stroke="none" />
      <path d="M50 24 L50 6 M63 33 L80 26 M58 48 L70 62 M42 48 L30 62 M37 33 L20 26" />
      <path d="M50 6 L80 26 M80 26 L70 62 M70 62 L30 62 M30 62 L20 26 M20 26 L50 6" />
    </svg>
  );
}

function JerseyGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="0.6">
      <path d="M36 4 L18 18 L28 34 L34 28 V92 H66 V28 L72 34 L82 18 L64 4 C64 12 57 17 50 17 C43 17 36 12 36 4 Z" />
      <circle cx="50" cy="46" r="9" opacity="0.7" />
    </svg>
  );
}

function GoalGlyph({ className }: { className?: string }) {
  const verticals = [30, 52, 74, 96];
  const horizontals = [35, 50, 65];
  return (
    <svg viewBox="0 0 140 90" className={className} fill="none" stroke="currentColor" strokeWidth="0.6">
      <path d="M15 88 V20 L30 6 H110 L125 20 V88" />
      <line x1="15" y1="20" x2="125" y2="20" opacity="0.6" />
      {verticals.map((x) => (
        <line key={x} x1={x} y1="20" x2={x} y2="88" opacity="0.4" />
      ))}
      {horizontals.map((y) => (
        <line key={y} x1="15" y1={y} x2="125" y2={y} opacity="0.4" />
      ))}
    </svg>
  );
}

function CornerFlagGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 70" className={className} fill="none" stroke="currentColor" strokeWidth="1">
      <line x1="6" y1="68" x2="6" y2="4" />
      <path d="M6 4 L34 14 L6 24 Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function PitchDivider() {
  return (
    <div className="relative mt-20 flex items-center gap-4" aria-hidden>
      <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
      <svg
        viewBox="0 0 40 40"
        className="h-8 w-8 shrink-0 text-slate-300 dark:text-white/10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        <circle cx="20" cy="20" r="14" />
        <circle cx="20" cy="20" r="1.4" fill="currentColor" stroke="none" />
      </svg>
      <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
    </div>
  );
}

function FieldLink({ location, name }: { location: string | null | undefined; name: string }) {
  if (!location) return <span>{name}</span>;
  return (
    <a
      href={googleMapsUrl(location)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-2 hover:text-emerald-600 dark:hover:text-emerald-400"
    >
      {name}
      <ExternalLink size={11} />
    </a>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const { data: settingsData } = useSettings();
  const siteName = settingsData?.data?.name ?? "Liga de Futbol";
  const logoUrl = siteLogoUrl(settingsData?.data);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-black/60">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-4 sm:px-6">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          className="text-slate-900 dark:text-white sm:hidden"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className="flex items-center gap-2">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
          )}
          <span className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">{siteName}</span>
        </div>

        <nav className="ml-10 hidden flex-1 items-center gap-8 text-xs font-bold uppercase tracking-widest sm:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-slate-500 transition-colors hover:text-slate-900 dark:text-white/60 dark:hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <ThemeToggle className="ml-auto shrink-0 rounded-full border border-slate-200 p-2 text-slate-600 transition-colors hover:border-emerald-500 hover:text-emerald-600 dark:border-white/20 dark:text-white/70 dark:hover:border-emerald-400 dark:hover:text-emerald-400 sm:ml-0" />

        <Link
          href="/admin"
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-300 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-700 transition-colors hover:border-emerald-500 hover:text-emerald-600 dark:border-white/30 dark:text-white dark:hover:border-emerald-400 dark:hover:text-emerald-400"
        >
          Portal de gestión
        </Link>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-slate-200 px-4 py-3 dark:border-white/10 sm:hidden">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-2.5 text-sm font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-white/70 dark:hover:bg-white/5 dark:hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}

function Footer() {
  const { data: settingsData } = useSettings();
  const siteName = settingsData?.data?.name ?? "Liga de Futbol";

  return (
    <footer className="relative overflow-hidden border-t border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-black">
      <BallGlyph className="pointer-events-none absolute -bottom-16 -right-16 -z-10 h-56 w-56 text-slate-900/[0.03] dark:text-white/[0.04]" />

      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-4 px-4 py-10 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left">
        <div>
          <p className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">
            {siteName} · {new Date().getFullYear()}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-white/40">
            Resultados, calendario y posiciones actualizados en tiempo real.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-bold uppercase tracking-widest">
          <a href="#proximos-partidos" className="text-slate-500 hover:text-emerald-600 dark:text-white/50 dark:hover:text-emerald-400">Próximos partidos</a>
          <a href="#tabla" className="text-slate-500 hover:text-emerald-600 dark:text-white/50 dark:hover:text-emerald-400">Tabla</a>
          <a href="#equipos" className="text-slate-500 hover:text-emerald-600 dark:text-white/50 dark:hover:text-emerald-400">Equipos</a>
          <Link href="/admin" className="text-slate-500 hover:text-emerald-600 dark:text-white/50 dark:hover:text-emerald-400">Portal de gestión</Link>
        </div>
      </div>
      <p className="border-t border-slate-200 py-4 text-center text-[11px] text-slate-400 dark:border-white/5 dark:text-white/30">
        © {new Date().getFullYear()} {siteName}. Todos los derechos reservados.
      </p>
    </footer>
  );
}

export default function LandingPage() {
  const { data: teamsData } = useTeams();
  const teams = teamsData?.data ?? [];
  const teamsById = Object.fromEntries(teams.map((t) => [t.id, t]));

  const { data: fieldsData } = useFields();
  const fields = fieldsData?.data ?? [];
  const fieldsById = Object.fromEntries(fields.map((f) => [f.id, f]));

  const { data: matchesData } = useMatches();
  const matches = matchesData?.data ?? [];
  const playedCount = matches.filter((m) => m.status === "played").length;
  const upcoming = matches
    .filter((m) => m.status === "scheduled")
    .sort((a, b) => `${a.date}T${a.time ?? "99:99"}`.localeCompare(`${b.date}T${b.time ?? "99:99"}`));

  const [heroIndex, setHeroIndex] = useState(0);
  const featured = upcoming[heroIndex] ?? null;
  const dotCount = Math.min(upcoming.length, 8);

  const goPrev = () => setHeroIndex((i) => (i - 1 + upcoming.length) % upcoming.length);
  const goNext = () => setHeroIndex((i) => (i + 1) % upcoming.length);

  const { data: standingsData } = useStandings();
  const [categoryIndex, setCategoryIndex] = useState(0);
  const activeCategory = LEAGUE_CATEGORIES[categoryIndex];
  const prevCategory = () => setCategoryIndex((i) => (i - 1 + LEAGUE_CATEGORIES.length) % LEAGUE_CATEGORIES.length);
  const nextCategory = () => setCategoryIndex((i) => (i + 1) % LEAGUE_CATEGORIES.length);
  const topTeams = (standingsData?.data ?? [])
    .filter((row) => row.category === activeCategory.value)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-[#060a09] dark:text-white">
      <Header />

      {/* Hero — poster band that follows the site theme */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-slate-50 text-slate-900 dark:from-[#0e2a21] dark:via-[#0a1512] dark:to-black dark:text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(16,185,129,0.08),transparent_55%)] dark:bg-[radial-gradient(circle_at_75%_20%,rgba(16,185,129,0.18),transparent_55%)]" />

        {/* Player 2 */}
        <div
          className="pointer-events-none absolute bottom-32 right-20 z-10 hidden w-[220px] sm:block sm:w-[260px] md:w-[300px] lg:w-[330px]"
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
          className="pointer-events-none absolute bottom-40 left-30 z-10 hidden w-[220px] sm:block sm:w-[260px] md:w-[300px] lg:w-[360px]"
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

        <div className="relative mx-auto flex w-full max-w-7xl flex-col px-4 pb-10 pt-14 sm:px-6 sm:pt-20">
          {/* Giant ghost number */}
          <span
            key={`ghost-${heroIndex}`}
            aria-hidden
            className="pointer-events-none absolute -top-6 right-0 z-0 select-none text-[9rem] font-black leading-none text-slate-900/[0.04] [animation:fade-in-up_0.4s_ease] dark:text-white/[0.05] sm:text-[16rem]"
          >
            {featured ? `J${featured.matchday}` : new Date().getFullYear()}
          </span>

          <div className="relative z-10 flex items-center gap-2 sm:gap-4">
            {upcoming.length > 1 && (
              <button
                type="button"
                onClick={goPrev}
                aria-label="Partido anterior"
                className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-400 transition-colors hover:border-emerald-500 hover:text-emerald-600 dark:border-white/15 dark:text-white/60 dark:hover:border-emerald-400 dark:hover:text-emerald-400 sm:flex"
              >
                <ChevronLeft size={20} />
              </button>
            )}

            <div key={heroIndex} className="flex-1 py-8 text-center [animation:fade-in-up_0.4s_ease] sm:py-12">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300">
                <Trophy size={12} /> {featured ? `Próximo partido · Jornada ${featured.matchday}` : `Temporada ${new Date().getFullYear()}`}
              </span>

              {featured ? (
                <>
                  <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
                    <div className="flex flex-col items-center gap-3 px-2">
                      <Avatar
                        src={teamsById[featured.homeTeamId] ? teamPhotoUrl(teamsById[featured.homeTeamId]) : null}
                        name={teamsById[featured.homeTeamId]?.name ?? "?"}
                        size={72}
                      />
                      <span className="max-w-[13rem] text-balance text-lg font-black leading-tight tracking-tight text-slate-900 dark:text-white sm:max-w-[16rem] sm:text-2xl">
                        {teamsById[featured.homeTeamId]?.name ?? "—"}
                      </span>
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-white/30 sm:text-base">vs</span>
                    <div className="flex flex-col items-center gap-3 px-2">
                      <Avatar
                        src={teamsById[featured.awayTeamId] ? teamPhotoUrl(teamsById[featured.awayTeamId]) : null}
                        name={teamsById[featured.awayTeamId]?.name ?? "?"}
                        size={72}
                      />
                      <span className="max-w-[13rem] text-balance text-lg font-black leading-tight tracking-tight text-slate-900 dark:text-white sm:max-w-[16rem] sm:text-2xl">
                        {teamsById[featured.awayTeamId]?.name ?? "—"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col items-center gap-1 text-slate-600 dark:text-white/70">
                    <span className="text-sm font-semibold">
                      {formatCalendarDate(featured.date, {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                      })}{" "}
                      · {featured.time ?? "hora por confirmar"}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-white/40">
                      <MapPinned size={13} />
                      <FieldLink
                        location={fieldsById[featured.fieldId]?.location}
                        name={fieldsById[featured.fieldId]?.name ?? "Cancha por confirmar"}
                      />
                    </span>
                  </div>

                  <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <a
                      href="#proximos-partidos"
                      className="rounded-full bg-emerald-400 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-emerald-300"
                    >
                      Ver calendario
                    </a>
                    <a
                      href="#tabla"
                      className="rounded-full border border-slate-300 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-700 transition-colors hover:border-slate-900 hover:text-slate-900 dark:border-white/25 dark:text-white dark:hover:border-white"
                    >
                      Ver tabla
                    </a>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="mx-auto mt-6 max-w-xl text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                    Todo el fútbol de la liga, en un solo lugar
                  </h1>
                  <p className="mx-auto mt-3 max-w-md text-sm text-slate-500 dark:text-white/50">
                    No hay partidos programados por el momento. Revisa la tabla de posiciones y los equipos
                    inscritos esta temporada.
                  </p>
                  <div className="mt-8">
                    <a
                      href="#tabla"
                      className="rounded-full bg-emerald-400 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-black transition-colors hover:bg-emerald-300"
                    >
                      Ver tabla de posiciones
                    </a>
                  </div>
                </>
              )}
            </div>

            {upcoming.length > 1 && (
              <button
                type="button"
                onClick={goNext}
                aria-label="Siguiente partido"
                className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-400 transition-colors hover:border-emerald-500 hover:text-emerald-600 dark:border-white/15 dark:text-white/60 dark:hover:border-emerald-400 dark:hover:text-emerald-400 sm:flex"
              >
                <ChevronRight size={20} />
              </button>
            )}
          </div>

          {/* Quick links */}
          <div className="relative z-10 mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 border-t border-slate-200 pt-6 text-[11px] font-bold uppercase tracking-widest dark:border-white/10 sm:justify-start">
            <a
              href="#proximos-partidos"
              className="flex items-center gap-1.5 text-slate-500 transition-colors hover:text-emerald-600 dark:text-white/50 dark:hover:text-emerald-400"
            >
              <CornerFlagGlyph className="h-3 w-3" /> Calendario
            </a>
            <a
              href="#tabla"
              className="flex items-center gap-1.5 text-slate-500 transition-colors hover:text-emerald-600 dark:text-white/50 dark:hover:text-emerald-400"
            >
              <CornerFlagGlyph className="h-3 w-3" /> Tabla
            </a>
            <a
              href="#equipos"
              className="flex items-center gap-1.5 text-slate-500 transition-colors hover:text-emerald-600 dark:text-white/50 dark:hover:text-emerald-400"
            >
              <CornerFlagGlyph className="h-3 w-3" /> Equipos
            </a>
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-white/50">
              <CornerFlagGlyph className="h-3 w-3" /> {playedCount} partidos jugados
            </span>
          </div>
        </div>

        {/* Bottom carousel strip */}
        {upcoming.length > 1 && (
          <div className="relative z-10 border-t border-slate-200 bg-slate-100/70 dark:border-white/10 dark:bg-black/30">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 text-xs font-bold uppercase tracking-widest sm:px-6">
              <button
                type="button"
                onClick={goPrev}
                className="flex items-center gap-1.5 text-slate-500 transition-colors hover:text-emerald-600 dark:text-white/50 dark:hover:text-emerald-400"
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
                    aria-label={`Ver partido ${i + 1}`}
                    className={`h-1.5 w-1.5 rounded-full transition-colors ${i === heroIndex % dotCount ? "bg-emerald-500 dark:bg-emerald-400" : "bg-slate-300 dark:bg-white/20"
                      }`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={goNext}
                className="flex items-center gap-1.5 text-slate-500 transition-colors hover:text-emerald-600 dark:text-white/50 dark:hover:text-emerald-400"
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

      <main className="mx-auto w-full max-w-7xl px-4 pb-4 sm:px-6">
        {/* Próximos partidos */}
        <motion.section id="proximos-partidos" className="relative mt-20 scroll-mt-24 overflow-hidden" {...sectionReveal}>
          <GoalGlyph className="pointer-events-none absolute -top-6 right-0 -z-10 h-40 w-64 text-slate-900/[0.035] dark:text-white/[0.04] sm:h-56 sm:w-96" />
          <Image
            src="/images/players-motion.webp"
            alt=""
            width={1200}
            height={1200}
            className="pointer-events-none absolute -left-16 -top-24 -z-10 hidden w-64 opacity-0 mix-blend-screen dark:opacity-60 sm:block md:w-80"
          />

          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Próximos partidos</h2>
              <p className="text-sm text-slate-500 dark:text-white/40">Calendario de la liga ordenado por fecha.</p>
            </div>
            <CalendarDays className="hidden text-emerald-600 dark:text-emerald-400 sm:block" size={22} />
          </div>

          {upcoming.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/40">
              No hay partidos programados por el momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {upcoming.slice(0, 6).map((match) => (
                <motion.div
                  key={match.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.3)] transition-colors hover:border-emerald-400/60 dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none dark:hover:border-emerald-400/40"
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:bg-white/5 dark:text-white/60">
                      Jornada {match.matchday}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 dark:text-white/40">
                      {formatCalendarDate(match.date, { day: "2-digit", month: "short" })} ·{" "}
                      {match.time ?? "hora por confirmar"}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2 py-2 text-center">
                    <div className="flex flex-1 items-center justify-end gap-2">
                      <span className="text-balance text-sm font-bold leading-tight text-slate-900 dark:text-white">
                        {teamsById[match.homeTeamId]?.name ?? "—"}
                      </span>
                      {teamsById[match.homeTeamId] && <CategoryDot category={teamsById[match.homeTeamId].category} />}
                      <Avatar
                        src={teamsById[match.homeTeamId] ? teamPhotoUrl(teamsById[match.homeTeamId]) : null}
                        name={teamsById[match.homeTeamId]?.name ?? "?"}
                        size={26}
                      />
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300">
                      vs
                    </span>
                    <div className="flex flex-1 items-center justify-start gap-2">
                      <Avatar
                        src={teamsById[match.awayTeamId] ? teamPhotoUrl(teamsById[match.awayTeamId]) : null}
                        name={teamsById[match.awayTeamId]?.name ?? "?"}
                        size={26}
                      />
                      {teamsById[match.awayTeamId] && <CategoryDot category={teamsById[match.awayTeamId].category} />}
                      <span className="text-balance text-sm font-bold leading-tight text-slate-900 dark:text-white">
                        {teamsById[match.awayTeamId]?.name ?? "—"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-white/40">
                    <MapPinned size={13} />
                    <FieldLink
                      location={fieldsById[match.fieldId]?.location}
                      name={fieldsById[match.fieldId]?.name ?? "Cancha por confirmar"}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        <PitchDivider />

        {/* Tabla de posiciones */}
        <motion.section id="tabla" className="relative mt-12 scroll-mt-24" {...sectionReveal}>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Tabla de posiciones</h2>
              <p className="text-sm text-slate-500 dark:text-white/40">
                Los 5 primeros lugares · {activeCategory.label}
              </p>
            </div>
            <Image
              src="/images/trophy-classic.webp"
              alt="Trofeo de la liga"
              width={600}
              height={970}
              className="hidden h-14 w-auto opacity-80 drop-shadow-[0_8px_16px_rgba(0,0,0,0.25)] dark:opacity-65 dark:drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] sm:block"
            />
          </div>

          {/* Category slider */}
          <div
            role="group"
            aria-label="Categoría de la tabla de posiciones"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                prevCategory();
              } else if (e.key === "ArrowRight") {
                e.preventDefault();
                nextCategory();
              }
            }}
            className="mb-4 flex items-center justify-center gap-3 outline-none sm:justify-start"
          >
            <button
              type="button"
              onClick={prevCategory}
              aria-label="Categoría anterior"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-500 transition-colors hover:border-emerald-500 hover:text-emerald-600 dark:border-white/15 dark:text-white/60 dark:hover:border-emerald-400 dark:hover:text-emerald-400"
            >
              <ChevronLeft size={18} />
            </button>

            <div key={categoryIndex} className="flex w-44 flex-col items-center gap-1.5 [animation:fade-in-up_0.25s_ease]">
              <span className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
                {activeCategory.label}
              </span>
              <div className="flex items-center gap-1.5">
                {LEAGUE_CATEGORIES.map((c, i) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategoryIndex(i)}
                    aria-label={`Ver ${c.label}`}
                    aria-current={i === categoryIndex}
                    className={`h-1.5 rounded-full transition-all ${
                      i === categoryIndex ? "w-5 bg-emerald-500 dark:bg-emerald-400" : "w-1.5 bg-slate-300 dark:bg-white/20"
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={nextCategory}
              aria-label="Siguiente categoría"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-500 transition-colors hover:border-emerald-500 hover:text-emerald-600 dark:border-white/15 dark:text-white/60 dark:hover:border-emerald-400 dark:hover:text-emerald-400"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_40px_-28px_rgba(15,23,42,0.3)] dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none">
            {topTeams.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-400 dark:text-white/40">
                Todavía no hay partidos jugados en {activeCategory.label}.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 text-left text-xs font-bold uppercase tracking-widest text-slate-400 dark:border-white/10 dark:text-white/30">
                  <tr>
                    <th className="px-5 py-3">#</th>
                    <th className="px-5 py-3">Equipo</th>
                    <th className="px-5 py-3 text-center">PJ</th>
                    <th className="px-5 py-3 text-center">DG</th>
                    <th className="px-5 py-3 text-center">PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {topTeams.map((row, index) => (
                    <tr key={row.teamId}>
                      <td className="px-5 py-3">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${index === 0
                            ? "bg-emerald-500 text-white dark:bg-emerald-400 dark:text-black"
                            : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/50"
                            }`}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-bold text-slate-900 dark:text-white">{row.name}</td>
                      <td className="px-5 py-3 text-center text-slate-500 dark:text-white/50">{row.played}</td>
                      <td className="px-5 py-3 text-center text-slate-500 dark:text-white/50">{row.goalDifference}</td>
                      <td className="px-5 py-3 text-center">
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-50 px-2 text-sm font-bold text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300">
                          {row.points}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="border-t border-slate-200 px-5 py-3 text-right dark:border-white/10">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600 hover:underline dark:text-emerald-400"
              >
                Ver tabla completa <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </motion.section>

        <PitchDivider />

        {/* Equipos */}
        <motion.section id="equipos" className="relative mt-12 scroll-mt-24 overflow-hidden" {...sectionReveal}>
          <JerseyGlyph className="pointer-events-none absolute -right-6 -top-8 -z-10 h-44 w-44 text-slate-900/[0.035] dark:text-white/[0.04] sm:h-60 sm:w-60" />

          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Equipos participantes</h2>
              <p className="text-sm text-slate-500 dark:text-white/40">{teams.length} equipo(s) inscritos esta temporada.</p>
            </div>
            <ShieldCheck className="hidden text-emerald-600 dark:text-emerald-400 sm:block" size={22} />
          </div>

          {teams.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/40">
              Todavía no hay equipos registrados.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {teams.map((team) => (
                <motion.div
                  key={team.id}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.3)] transition-colors hover:border-emerald-400/60 dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none dark:hover:border-emerald-400/40"
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.15 }}
                >
                  <Avatar src={teamPhotoUrl(team)} name={team.name} size={40} />
                  <div className="min-w-0">
                    <span className="block truncate text-sm font-bold text-slate-900 dark:text-white">{team.name}</span>
                    <CategoryBadge category={team.category} className="mt-1" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </main>

      {/* Cinematic band — pairs with the hero, follows the site theme */}
      <motion.section
        className="relative mt-20 h-56 overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-slate-50 dark:from-[#0e2a21] dark:via-[#0a1512] dark:to-black sm:h-72"
        {...sectionReveal}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(16,185,129,0.10),transparent_60%)] dark:bg-[radial-gradient(circle_at_50%_30%,rgba(16,185,129,0.22),transparent_60%)]" />
        <div className="relative flex h-full flex-col items-center justify-end gap-1 pb-8 text-center">
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-emerald-700 dark:text-emerald-300">
            Temporada {new Date().getFullYear()}
          </span>
          <p className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white sm:text-xl">
            Cada jornada, en la mejor cancha
          </p>
        </div>
      </motion.section>

      <Footer />
    </div>
  );
}
