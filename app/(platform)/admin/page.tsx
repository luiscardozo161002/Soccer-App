"use client";

import { useState } from "react";
import { Trophy, Shield, CalendarDays, Clock3 } from "lucide-react";
import { useStandings, type StandingsRow } from "@/hooks/useStandings";
import { useTeams } from "@/hooks/useTeams";
import { useMatches } from "@/hooks/useMatches";
import { formatCalendarDate } from "@/lib/utils/date";
import { LEAGUE_CATEGORIES, type LeagueCategoryValue } from "@/lib/constants/league-categories";
import {
  standingsZone,
  standingsZonesForCategory,
  STANDINGS_ZONE_BADGE_CLASSES,
  STANDINGS_ZONE_DOT_CLASSES,
  STANDINGS_ZONE_LABELS,
} from "@/lib/constants/standings-zones";
import { Card, CardBody } from "@/components/ui/card";
import { Table, Thead, Th, Tbody, Td, EmptyRow } from "@/components/ui/table";
import { Pagination, DEFAULT_PAGE_SIZE, type PageSize } from "@/components/ui/pagination";
import { Field, Select } from "@/components/ui/field";
import "@/app/globals.css"

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
    <Card className="flex items-center gap-3 p-3.5">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg} ${text}`}>
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
        <p className="truncate text-base font-extrabold tracking-tight text-ink">{value}</p>
        <p className="truncate text-[11px] text-muted">{hint}</p>
      </div>
    </Card>
  );
}

function StandingsTableHead() {
  return (
    <Thead>
      <Th className="sticky left-0 z-10 bg-surface">Equipo</Th>
      <Th className="text-center" title="Juegos jugados">J.J.</Th>
      <Th className="text-center" title="Juegos ganados">J.G.</Th>
      <Th className="text-center" title="Juegos empatados">J.E.</Th>
      <Th className="text-center" title="Juegos perdidos">J.P.</Th>
      <Th className="text-center" title="Goles a favor">G.F.</Th>
      <Th className="text-center" title="Goles en contra">G.C.</Th>
      <Th className="text-center" title="Diferencia de goles">DIF.</Th>
      <Th className="text-center" title="Puntos">PTS.</Th>
    </Thead>
  );
}

function StandingsRows({
  rows,
  category,
  rankOffset = 0,
}: {
  rows: StandingsRow[];
  category: LeagueCategoryValue;
  rankOffset?: number;
}) {
  return (
    <>
      {rows.map((row, index) => {
        const rank = rankOffset + index;
        const zone = standingsZone(category, rank);
        return (
        <tr key={row.teamId}>
          <Td className="sticky left-0 z-10 bg-surface">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${STANDINGS_ZONE_BADGE_CLASSES[zone]}`}
              >
                {rank + 1}
              </span>
              <span className="font-semibold text-ink">{row.name}</span>
            </div>
          </Td>
          <Td className="text-center">{row.played}</Td>
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
    </>
  );
}

function StandingsZoneLegend({ category }: { category: LeagueCategoryValue }) {
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-5 py-3 text-xs text-muted">
      {standingsZonesForCategory(category).map((zone) => (
        <span key={zone} className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${STANDINGS_ZONE_DOT_CLASSES[zone]}`} />
          {STANDINGS_ZONE_LABELS[zone]}
        </span>
      ))}
    </p>
  );
}

export default function StandingsPage() {
  // Defaults to a single category instead of "all" so the page doesn't load
  // and render every team across every category at once.
  const [categoryFilter, setCategoryFilter] = useState<LeagueCategoryValue | "all">(LEAGUE_CATEGORIES[0].value);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);
  const { data, isLoading, isError } = useStandings();
  const rows = data?.data ?? [];
  const filteredRows = categoryFilter === "all" ? rows : rows.filter((r) => r.category === categoryFilter);

  const { data: teamsData } = useTeams();
  const teams = teamsData?.data ?? [];
  const filteredTeams = categoryFilter === "all" ? teams : teams.filter((t) => t.category === categoryFilter);

  const { data: matchesData } = useMatches();
  const matches = matchesData?.data ?? [];
  const filteredMatches = categoryFilter === "all" ? matches : matches.filter((m) => m.category === categoryFilter);
  const playedCount = filteredMatches.filter((m) => m.status === "played").length;
  const nextMatch = filteredMatches
    .filter((m) => m.status === "scheduled")
    .sort((a, b) => `${a.date}T${a.time ?? "99:99"}`.localeCompare(`${b.date}T${b.time ?? "99:99"}`))[0];
  const teamsById = Object.fromEntries(teams.map((t) => [t.id, t.name]));
  const leader = filteredRows[0];

  const totalItems = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const paginationMeta = { page: safePage, pageSize, totalItems, totalPages };
  const groupedByCategory =
    categoryFilter === "all"
      ? LEAGUE_CATEGORIES.map((c) => ({ category: c, rows: filteredRows.filter((r) => r.category === c.value) }))
      : null;

  const handleCategoryChange = (value: LeagueCategoryValue | "all") => {
    setCategoryFilter(value);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink">Tabla de posiciones</h1>
          <p className="text-sm text-muted">Calculada en tiempo real a partir de los partidos jugados.</p>
        </div>
        <div className="w-56">
          <Field label="Categoría">
            <Select
              value={categoryFilter}
              onChange={(e) => handleCategoryChange(e.target.value as LeagueCategoryValue | "all")}
            >
              {LEAGUE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
              <option value="all">Todas las categorías</option>
            </Select>
          </Field>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={Shield}
          tone="teal"
          label="Equipos"
          value={String(filteredTeams.length)}
          hint={categoryFilter === "all" ? "Registrados en la liga" : "Registrados en la categoría"}
        />
        <StatTile
          icon={CalendarDays}
          tone="violet"
          label="Partidos jugados"
          value={`${playedCount}/${filteredMatches.length}`}
          hint={categoryFilter === "all" ? "Del calendario total" : "Del calendario de la categoría"}
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
          hint={nextMatch ? `${formatCalendarDate(nextMatch.date)} · ${nextMatch.time ?? "hora por confirmar"}` : "No hay partidos programados"}
        />
      </div>

      {isLoading && (
        <Card>
          <Table>
            <StandingsTableHead />
            <Tbody>
              <EmptyRow colSpan={9} message="Cargando..." />
            </Tbody>
          </Table>
        </Card>
      )}
      {isError && (
        <Card>
          <Table>
            <StandingsTableHead />
            <Tbody>
              <EmptyRow colSpan={9} message="No se pudo cargar la tabla de posiciones." />
            </Tbody>
          </Table>
        </Card>
      )}

      {!isLoading && !isError && groupedByCategory && (
        <div className="flex flex-col gap-4">
          {groupedByCategory.map(({ category, rows }) => (
            <Card key={category.value}>
              <h2 className="border-b border-border px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-ink">
                {category.label}
              </h2>
              <Table>
                <StandingsTableHead />
                <Tbody>
                  {rows.length === 0 ? (
                    <EmptyRow colSpan={9} message={`Todavía no hay partidos jugados en ${category.label}.`} />
                  ) : (
                    <StandingsRows rows={rows} category={category.value} />
                  )}
                </Tbody>
              </Table>
              {rows.length > 0 && <StandingsZoneLegend category={category.value} />}
            </Card>
          ))}
        </div>
      )}

      {!isLoading && !isError && !groupedByCategory && (
        <Card>
          <Table>
            <StandingsTableHead />
            <Tbody>
              {filteredRows.length === 0 ? (
                <EmptyRow colSpan={9} message="Todavía no hay partidos jugados." />
              ) : (
                <StandingsRows
                  rows={pagedRows}
                  category={categoryFilter as LeagueCategoryValue}
                  rankOffset={(safePage - 1) * pageSize}
                />
              )}
            </Tbody>
          </Table>
          <Pagination
            meta={paginationMeta}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
          {filteredRows.length > 0 && <StandingsZoneLegend category={categoryFilter as LeagueCategoryValue} />}
        </Card>
      )}

      <Card>
        <p className="flex flex-wrap gap-x-3 gap-y-1 px-5 py-3 text-xs text-muted">
          <span><span className="font-semibold text-ink">J.J.</span> Juegos jugados</span>
          <span><span className="font-semibold text-ink">J.G.</span> Juegos ganados</span>
          <span><span className="font-semibold text-ink">J.E.</span> Juegos empatados</span>
          <span><span className="font-semibold text-ink">J.P.</span> Juegos perdidos</span>
          <span><span className="font-semibold text-ink">G.F.</span> Goles a favor</span>
          <span><span className="font-semibold text-ink">G.C.</span> Goles en contra</span>
          <span><span className="font-semibold text-ink">DIF.</span> Diferencia de goles</span>
          <span><span className="font-semibold text-ink">PTS.</span> Puntos</span>
        </p>
      </Card>
    </div>
  );
}
