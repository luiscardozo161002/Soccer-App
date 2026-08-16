"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useSeason } from "@/hooks/useSeasons";
import { useStandings } from "@/hooks/useStandings";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, Thead, Th, Tbody, Td, EmptyRow } from "@/components/ui/table";

export default function SeasonHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: seasonData, isLoading: seasonLoading } = useSeason(id);
  const season = seasonData?.data;

  const { data, isLoading, isError } = useStandings(id);
  const rows = data?.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href="/admin/history"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft size={15} /> Historial de torneos
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-extrabold tracking-tight text-ink">
            {seasonLoading ? "Cargando..." : season?.name ?? "Temporada"}
          </h1>
          {season && (
            <Badge tone={season.status === "active" ? "active" : "inactive"}>
              {season.status === "active" ? "Activa" : "Archivada"}
            </Badge>
          )}
        </div>
        {season && (
          <p className="text-sm text-muted">
            {new Date(season.startDate).toLocaleDateString("es-MX")} —{" "}
            {season.endDate ? new Date(season.endDate).toLocaleDateString("es-MX") : "presente"}
          </p>
        )}
      </div>

      <Card>
        <Table>
          <Thead>
            <Th className="sticky left-0 z-10 bg-surface">Equipo</Th>
            <Th className="text-center" title="Partidos jugados">PJ</Th>
            <Th className="text-center" title="Partidos ganados">PG</Th>
            <Th className="text-center" title="Partidos empatados">PE</Th>
            <Th className="text-center" title="Partidos perdidos">PP</Th>
            <Th className="text-center" title="Goles a favor">GF</Th>
            <Th className="text-center" title="Goles en contra">GC</Th>
            <Th className="text-center" title="Diferencia de goles">DG</Th>
            <Th className="text-center" title="Puntos">PTS</Th>
          </Thead>
          <Tbody>
            {isLoading && <EmptyRow colSpan={9} message="Cargando..." />}
            {isError && <EmptyRow colSpan={9} message="No se pudo cargar la tabla de esta temporada." />}
            {!isLoading && !isError && rows.length === 0 && (
              <EmptyRow colSpan={9} message="Esta temporada no tuvo partidos jugados." />
            )}
            {rows.map((row, index) => (
              <tr key={row.teamId}>
                <Td className="sticky left-0 z-10 bg-surface">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        index === 0
                          ? "bg-primary text-white"
                          : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/50"
                      }`}
                    >
                      {index + 1}
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
            ))}
          </Tbody>
        </Table>
      </Card>
    </div>
  );
}
