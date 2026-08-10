"use client";

import { Trophy, Shield, CalendarDays, Clock3 } from "lucide-react";
import { useStandings } from "@/hooks/useStandings";
import { useTeams } from "@/hooks/useTeams";
import { useMatches } from "@/hooks/useMatches";
import { Card, CardBody } from "@/components/ui/card";
import { Table, Thead, Th, Tbody, Td, EmptyRow } from "@/components/ui/table";

const tileTones = {
  teal: { bg: "bg-primary-light", text: "text-primary" },
  violet: { bg: "bg-violet-100", text: "text-violet-600" },
  amber: { bg: "bg-amber-100", text: "text-amber-600" },
  rose: { bg: "bg-rose-100", text: "text-rose-600" },
} as const;

function StatTile({
  icon: Icon,
  tone,
  label,
  value,
  hint,
}: {
  icon: typeof Trophy;
  tone: keyof typeof tileTones;
  label: string;
  value: string;
  hint: string;
}) {
  const { bg, text } = tileTones[tone];
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${bg} ${text}`}>
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
        <p className="truncate text-xl font-extrabold tracking-tight text-ink">{value}</p>
        <p className="truncate text-xs text-muted">{hint}</p>
      </div>
    </Card>
  );
}

export default function StandingsPage() {
  const { data, isLoading, isError } = useStandings();
  const rows = data?.data ?? [];

  const { data: teamsData } = useTeams();
  const teams = teamsData?.data ?? [];

  const { data: matchesData } = useMatches();
  const matches = matchesData?.data ?? [];
  const playedCount = matches.filter((m) => m.status === "played").length;
  const nextMatch = matches
    .filter((m) => m.status === "scheduled")
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))[0];
  const teamsById = Object.fromEntries(teams.map((t) => [t.id, t.name]));
  const leader = rows[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Tabla de posiciones</h1>
        <p className="text-sm text-muted">Calculada en tiempo real a partir de los partidos jugados.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={Shield} tone="teal" label="Equipos" value={String(teams.length)} hint="Registrados en la liga" />
        <StatTile
          icon={CalendarDays}
          tone="violet"
          label="Partidos jugados"
          value={`${playedCount}/${matches.length}`}
          hint="Del calendario total"
        />
        <StatTile
          icon={Trophy}
          tone="amber"
          label="Líder actual"
          value={leader ? leader.name : "—"}
          hint={leader ? `${leader.points} pts` : "Sin partidos jugados"}
        />
        <StatTile
          icon={Clock3}
          tone="rose"
          label="Próximo partido"
          value={nextMatch ? `${teamsById[nextMatch.homeTeamId] ?? "—"} vs ${teamsById[nextMatch.awayTeamId] ?? "—"}` : "—"}
          hint={nextMatch ? `${new Date(nextMatch.date).toLocaleDateString("es-MX")} · ${nextMatch.time}` : "No hay partidos programados"}
        />
      </div>

      <Card>
        {rows.length > 4 && (
          <div className="flex flex-wrap gap-4 border-b border-slate-100 px-6 py-3 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Zona de líderes
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" /> Zona de descenso
            </span>
          </div>
        )}
        <Table>
          <Thead>
            <Th className="sticky left-0 z-10 bg-white">Equipo</Th>
            <Th className="text-center" title="Partidos jugados">PJ</Th>
            <Th className="text-center" title="Partidos pendientes">PTE</Th>
            <Th className="text-center" title="Partidos ganados">PG</Th>
            <Th className="text-center" title="Partidos empatados">PE</Th>
            <Th className="text-center" title="Partidos perdidos">PP</Th>
            <Th className="text-center" title="Goles a favor">GF</Th>
            <Th className="text-center" title="Goles en contra">GC</Th>
            <Th className="text-center" title="Diferencia de goles">DG</Th>
            <Th className="text-center" title="Puntos">Pts</Th>
          </Thead>
          <Tbody>
            {isLoading && <EmptyRow colSpan={10} message="Cargando..." />}
            {isError && <EmptyRow colSpan={10} message="No se pudo cargar la tabla de posiciones." />}
            {!isLoading && !isError && rows.length === 0 && (
              <EmptyRow colSpan={10} message="Todavía no hay partidos jugados." />
            )}
            {rows.map((row, index) => {
              const zoneClass =
                rows.length > 4 && index < 3
                  ? "border-l-4 border-l-primary"
                  : rows.length > 4 && index >= rows.length - 2
                    ? "border-l-4 border-l-red-400"
                    : "border-l-4 border-l-transparent";
              return (
                <tr key={row.teamId}>
                  <Td className={`sticky left-0 z-10 bg-white ${zoneClass}`}>
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          index === 0 ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="font-semibold text-ink">{row.name}</span>
                    </div>
                  </Td>
                  <Td className="text-center">{row.played}</Td>
                  <Td className="text-center">{row.pending}</Td>
                  <Td className="text-center">{row.won}</Td>
                  <Td className="text-center">{row.drawn}</Td>
                  <Td className="text-center">{row.lost}</Td>
                  <Td className="text-center">{row.goalsFor}</Td>
                  <Td className="text-center">{row.goalsAgainst}</Td>
                  <Td className="text-center">{row.goalDifference}</Td>
                  <Td className="text-center">
                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary-light px-2 text-sm font-bold text-primary">
                      {row.points}
                    </span>
                  </Td>
                </tr>
              );
            })}
          </Tbody>
        </Table>
      </Card>
    </div>
  );
}
