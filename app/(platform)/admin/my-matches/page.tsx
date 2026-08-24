"use client";

import { useState } from "react";
import { Images, Lock } from "lucide-react";
import { useMatches, type Match } from "@/hooks/useMatches";
import { useTeams } from "@/hooks/useTeams";
import { useFields } from "@/hooks/useFields";
import { formatCalendarDate } from "@/lib/utils/date";
import { Card } from "@/components/ui/card";
import { Table, Thead, Th, Tbody, Td, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryDot } from "@/components/ui/category-badge";
import { RegisterResultForm } from "@/components/register-result-form";
import { MatchEvidenceViewerModal } from "@/components/forms/MatchEvidenceViewerModal";
import { statusLabels } from "@/components/forms/EditMatchModal";

function toDateTime(date: string, time: string) {
  return new Date(`${date.slice(0, 10)}T${time}:00`);
}

function canRegisterResult(match: Match) {
  if (match.resultLocked) return false;
  if (!match.time) return false;
  if (match.status === "played" || match.status === "cancelled") return true;
  return match.status === "scheduled" && toDateTime(match.date, match.time) <= new Date();
}

// The API already scopes the response to this referee's own assigned
// matches for an "arbitro" session — no client-side filtering needed.
export default function MyMatchesPage() {
  const [registeringMatch, setRegisteringMatch] = useState<Match | null>(null);
  const [viewingEvidenceMatch, setViewingEvidenceMatch] = useState<Match | null>(null);
  const { data, isLoading, isError } = useMatches({ pageSize: 100 });
  const matches = data?.data ?? [];

  const { data: teamsData } = useTeams();
  const teams = teamsData?.data ?? [];
  const teamsById = Object.fromEntries(teams.map((t) => [t.id, t.name]));
  const teamCategoryById = Object.fromEntries(teams.map((t) => [t.id, t.category]));

  const { data: fieldsData } = useFields();
  const fields = fieldsData?.data ?? [];
  const fieldsById = Object.fromEntries(fields.map((f) => [f.id, f.name]));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-ink">Mis partidos</h1>
        <p className="text-sm text-muted">Partidos que tienes asignados como árbitro.</p>
      </div>

      <Card>
        <Table>
          <Thead>
            <Th>Jornada</Th>
            <Th>Encuentro</Th>
            <Th>Cancha</Th>
            <Th>Fecha</Th>
            <Th>Estatus</Th>
            <Th className="text-right">Acciones</Th>
          </Thead>
          <Tbody>
            {isLoading && <EmptyRow colSpan={6} message="Cargando..." />}
            {isError && <EmptyRow colSpan={6} message="No se pudo cargar la lista de partidos." />}
            {!isLoading && !isError && matches.length === 0 && (
              <EmptyRow colSpan={6} message="No tienes partidos asignados." />
            )}
            {matches.map((match) => (
              <tr key={match.id}>
                <Td>
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-muted">
                    {match.matchday}
                  </span>
                </Td>
                <Td>
                  <div className="flex flex-col gap-0.5 text-sm">
                    <span className="flex items-center gap-1.5 font-semibold text-ink">
                      {teamCategoryById[match.homeTeamId] && <CategoryDot category={teamCategoryById[match.homeTeamId]} />}
                      {teamsById[match.homeTeamId] ?? "—"}
                    </span>
                    <span className="text-xs text-muted">vs</span>
                    <span className="flex items-center gap-1.5 font-semibold text-ink">
                      {teamCategoryById[match.awayTeamId] && <CategoryDot category={teamCategoryById[match.awayTeamId]} />}
                      {teamsById[match.awayTeamId] ?? "—"}
                    </span>
                  </div>
                </Td>
                <Td>{fieldsById[match.fieldId] ?? "—"}</Td>
                <Td>
                  {formatCalendarDate(match.date)}
                  <span className="text-muted"> · {match.time ?? "hora por definir"}</span>
                </Td>
                <Td>
                  <Badge tone={match.status}>{statusLabels[match.status]}</Badge>
                </Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-1">
                    {canRegisterResult(match) && (
                      <Button variant="secondary" onClick={() => setRegisteringMatch(match)}>
                        Registrar resultado
                      </Button>
                    )}
                    {match.resultLocked && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Ver evidencia de la jornada ${match.matchday}`}
                          title="Ver evidencia fotográfica"
                          onClick={() => setViewingEvidenceMatch(match)}
                        >
                          <Images size={20} />
                        </Button>
                        <span
                          className="flex items-center gap-1 rounded-full bg-primary-light px-2.5 py-1 text-[10px] font-bold uppercase text-primary"
                          title="Resultado confirmado: ya no se puede editar"
                        >
                          <Lock size={12} />
                          Confirmado
                        </span>
                      </>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </Tbody>
        </Table>
      </Card>

      {registeringMatch && (
        <RegisterResultForm
          match={{
            id: registeringMatch.id,
            matchday: registeringMatch.matchday,
            homeTeamId: registeringMatch.homeTeamId,
            awayTeamId: registeringMatch.awayTeamId,
            homeTeamName: teamsById[registeringMatch.homeTeamId] ?? "Local",
            awayTeamName: teamsById[registeringMatch.awayTeamId] ?? "Visitante",
          }}
          onDone={() => setRegisteringMatch(null)}
        />
      )}
      <MatchEvidenceViewerModal
        match={
          viewingEvidenceMatch && {
            id: viewingEvidenceMatch.id,
            matchday: viewingEvidenceMatch.matchday,
            homeTeamName: teamsById[viewingEvidenceMatch.homeTeamId] ?? "Local",
            awayTeamName: teamsById[viewingEvidenceMatch.awayTeamId] ?? "Visitante",
          }
        }
        onClose={() => setViewingEvidenceMatch(null)}
      />
    </div>
  );
}
