"use client";

import Link from "next/link";
import { Trophy, ShieldCheck, CalendarDays, MapPinned, ArrowRight } from "lucide-react";
import { useStandings } from "@/hooks/useStandings";
import { useTeams, teamPhotoUrl } from "@/hooks/useTeams";
import { useMatches } from "@/hooks/useMatches";
import { useFields } from "@/hooks/useFields";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

function Header() {
  return (
    <header className="sticky top-0 z-20 px-4 pt-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 rounded-2xl border border-white/70 bg-white/80 px-5 py-3 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.25)] backdrop-blur">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-lg text-white shadow-[0_8px_16px_-6px_rgba(13,148,136,0.6)]">
            ⚽
          </span>
          <span className="text-sm font-extrabold tracking-tight text-ink">Soccer App</span>
        </div>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-muted sm:flex">
          <a href="#proximos-partidos" className="transition-colors hover:text-ink">
            Próximos partidos
          </a>
          <a href="#tabla" className="transition-colors hover:text-ink">
            Tabla
          </a>
          <a href="#equipos" className="transition-colors hover:text-ink">
            Equipos
          </a>
        </nav>
        <Link href="/admin">
          <Button size="md">
            Portal de gestión <ArrowRight size={15} />
          </Button>
        </Link>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mx-auto mt-16 w-full max-w-6xl px-4 pb-10 sm:px-6">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/70 bg-white/70 px-6 py-8 text-center shadow-[0_16px_40px_-24px_rgba(15,23,42,0.2)] backdrop-blur sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="text-sm font-extrabold tracking-tight text-ink">⚽ Soccer App · Liga {new Date().getFullYear()}</p>
          <p className="mt-1 text-xs text-muted">Resultados, calendario y posiciones actualizados en tiempo real.</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-muted">
          <a href="#proximos-partidos" className="hover:text-ink">Próximos partidos</a>
          <a href="#tabla" className="hover:text-ink">Tabla de posiciones</a>
          <a href="#equipos" className="hover:text-ink">Equipos</a>
          <Link href="/admin" className="hover:text-ink">Portal de gestión</Link>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-muted">© {new Date().getFullYear()} Soccer App. Todos los derechos reservados.</p>
    </footer>
  );
}

export default function LandingPage() {
  const { data: teamsData } = useTeams();
  const teams = teamsData?.data ?? [];
  const teamsById = Object.fromEntries(teams.map((t) => [t.id, t.name]));

  const { data: fieldsData } = useFields();
  const fields = fieldsData?.data ?? [];
  const fieldsById = Object.fromEntries(fields.map((f) => [f.id, f.name]));

  const { data: matchesData } = useMatches();
  const matches = matchesData?.data ?? [];
  const playedCount = matches.filter((m) => m.status === "played").length;
  const upcoming = matches
    .filter((m) => m.status === "scheduled")
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
    .slice(0, 6);

  const { data: standingsData } = useStandings();
  const topTeams = (standingsData?.data ?? []).slice(0, 5);

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto w-full max-w-6xl px-4 pb-4 pt-12 sm:px-6 sm:pt-20">
        {/* Hero */}
        <section className="flex flex-col items-center gap-6 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1 text-xs font-bold text-primary">
            <Trophy size={13} /> Temporada Liga {new Date().getFullYear()}
          </span>
          <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            Todo el fútbol de la liga, en un solo lugar
          </h1>
          <p className="max-w-xl text-base text-muted">
            Calendario de partidos, resultados y tabla de posiciones actualizados en tiempo real para
            equipos, jugadores y aficionados.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href="#proximos-partidos">
              <Button size="md" className="px-5 py-2.5 text-sm">
                Ver próximos partidos
              </Button>
            </a>
            <Link href="/admin">
              <Button variant="secondary" size="md" className="px-5 py-2.5 text-sm">
                Portal de gestión
              </Button>
            </Link>
          </div>

          <div className="mt-4 grid w-full max-w-2xl grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.2)] backdrop-blur">
              <p className="text-2xl font-extrabold text-ink">{teams.length}</p>
              <p className="text-xs text-muted">Equipos</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.2)] backdrop-blur">
              <p className="text-2xl font-extrabold text-ink">{playedCount}</p>
              <p className="text-xs text-muted">Partidos jugados</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.2)] backdrop-blur">
              <p className="text-2xl font-extrabold text-ink">{upcoming.length}</p>
              <p className="text-xs text-muted">Próximos partidos</p>
            </div>
          </div>
        </section>

        {/* Próximos partidos */}
        <section id="proximos-partidos" className="mt-20 scroll-mt-24">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-ink">Próximos partidos</h2>
              <p className="text-sm text-muted">Calendario de la liga ordenado por fecha.</p>
            </div>
            <CalendarDays className="hidden text-primary sm:block" size={22} />
          </div>

          {upcoming.length === 0 ? (
            <div className="rounded-2xl border border-white/70 bg-white/70 p-8 text-center text-sm text-muted shadow-[0_16px_40px_-24px_rgba(15,23,42,0.2)] backdrop-blur">
              No hay partidos programados por el momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {upcoming.map((match) => (
                <div
                  key={match.id}
                  className="flex flex-col gap-3 rounded-2xl border border-white/70 bg-white/80 p-5 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.22)] backdrop-blur"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                      Jornada {match.matchday}
                    </span>
                    <span className="text-xs font-semibold text-muted">
                      {new Date(match.date).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })} ·{" "}
                      {match.time}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-3 py-2 text-center">
                    <span className="flex-1 truncate font-bold text-ink">{teamsById[match.homeTeamId] ?? "—"}</span>
                    <span className="shrink-0 rounded-full bg-primary-light px-2 py-0.5 text-xs font-bold text-primary">
                      vs
                    </span>
                    <span className="flex-1 truncate font-bold text-ink">{teamsById[match.awayTeamId] ?? "—"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted">
                    <MapPinned size={13} /> {fieldsById[match.fieldId] ?? "Cancha por confirmar"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Tabla de posiciones */}
        <section id="tabla" className="mt-20 scroll-mt-24">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-ink">Tabla de posiciones</h2>
              <p className="text-sm text-muted">Los 5 primeros lugares de la temporada.</p>
            </div>
            <Trophy className="hidden text-primary sm:block" size={22} />
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.22)] backdrop-blur">
            {topTeams.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted">Todavía no hay partidos jugados.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-5 py-3">#</th>
                    <th className="px-5 py-3">Equipo</th>
                    <th className="px-5 py-3 text-center">PJ</th>
                    <th className="px-5 py-3 text-center">DG</th>
                    <th className="px-5 py-3 text-center">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topTeams.map((row, index) => (
                    <tr key={row.teamId}>
                      <td className="px-5 py-3">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${index === 0 ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
                            }`}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-semibold text-ink">{row.name}</td>
                      <td className="px-5 py-3 text-center text-slate-600">{row.played}</td>
                      <td className="px-5 py-3 text-center text-slate-600">{row.goalDifference}</td>
                      <td className="px-5 py-3 text-center">
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary-light px-2 text-sm font-bold text-primary">
                          {row.points}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="border-t border-slate-100 px-5 py-3 text-right">
              <Link href="/admin" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                Ver tabla completa <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* Equipos */}
        <section id="equipos" className="mt-20 scroll-mt-24">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-ink">Equipos participantes</h2>
              <p className="text-sm text-muted">{teams.length} equipo(s) inscritos esta temporada.</p>
            </div>
            <ShieldCheck className="hidden text-primary sm:block" size={22} />
          </div>

          {teams.length === 0 ? (
            <div className="rounded-2xl border border-white/70 bg-white/70 p-8 text-center text-sm text-muted shadow-[0_16px_40px_-24px_rgba(15,23,42,0.2)] backdrop-blur">
              Todavía no hay equipos registrados.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/80 p-4 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.2)] backdrop-blur"
                >
                  <Avatar src={teamPhotoUrl(team)} name={team.name} size={40} />
                  <span className="truncate text-sm font-bold text-ink">{team.name}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
