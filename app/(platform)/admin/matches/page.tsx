"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Lock, Plus, Images, PencilLine } from "lucide-react";
import { toast } from "sonner";
import { useMatches, useCreateMatch, useLatestMatchday, type MatchStatus, type Match } from "@/hooks/useMatches";
import { useTeams } from "@/hooks/useTeams";
import { useFields } from "@/hooks/useFields";
import { useCards } from "@/hooks/useCards";
import { ApiError } from "@/lib/errors";
import { formatCalendarDate, todayLocalISODate } from "@/lib/utils/date";
import { LEAGUE_CATEGORIES, type LeagueCategoryValue } from "@/lib/constants/league-categories";
import { blockNonIntegerKeys } from "@/lib/utils/forms";
import { Card } from "@/components/ui/card";
import { Table, Thead, Th, Tbody, Td, EmptyRow } from "@/components/ui/table";
import { Pagination, DEFAULT_PAGE_SIZE, type PageSize } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { CategoryDot } from "@/components/ui/category-badge";
import { Modal } from "@/components/ui/modal";
import { EmptyOptionsHint } from "@/components/ui/empty-options-hint";
import { RegisterResultForm } from "@/components/register-result-form";
import { MatchEvidenceViewerModal } from "@/components/forms/MatchEvidenceViewerModal";
import {
  EditMatchModal,
  statusLabels,
  isDateNotBeforeToday,
  timeFieldSchema,
  TIME_OPTIONS,
} from "@/components/forms/EditMatchModal";

function toDateTime(date: string, time: string) {
  return new Date(`${date.slice(0, 10)}T${time}:00`);
}

function canRegisterResult(match: Match) {
  if (match.resultLocked) return false;
  if (!match.time) return false;
  if (match.status === "played" || match.status === "cancelled") return true;
  return match.status === "scheduled" && toDateTime(match.date, match.time) <= new Date();
}

const createMatchSchema = z
  .object({
    homeTeamId: z.string().uuid("Selecciona el equipo local"),
    awayTeamId: z.string().uuid("Selecciona el equipo visitante"),
    fieldId: z.string().uuid("Selecciona la cancha"),
    matchday: z.coerce.number().int().min(1, "Jornada inválida"),
    date: z.string().min(1, "La fecha es obligatoria"),
    time: timeFieldSchema,
  })
  .refine((data) => data.homeTeamId !== data.awayTeamId, {
    message: "El local y el visitante deben ser distintos",
    path: ["awayTeamId"],
  })
  .refine((data) => isDateNotBeforeToday(data.date), {
    message: "La fecha no puede ser anterior a hoy",
    path: ["date"],
  });
type CreateMatchFormInput = z.input<typeof createMatchSchema>;
type CreateMatchFormOutput = z.output<typeof createMatchSchema>;

function CardsIndicator({ matchId, cardsByMatch }: { matchId: string; cardsByMatch: Map<string, { yellow: number; red: number }> }) {
  const counts = cardsByMatch.get(matchId);
  if (!counts || (counts.yellow === 0 && counts.red === 0)) {
    return <span className="text-muted/60">—</span>;
  }
  return (
    <div className="flex items-center justify-center gap-2 text-xs font-semibold">
      {counts.yellow > 0 && (
        <span className="flex items-center gap-1 text-amber-600">
          <span className="h-3 w-2.5 rounded-[2px] bg-yellow-400" />
          {counts.yellow}
        </span>
      )}
      {counts.red > 0 && (
        <span className="flex items-center gap-1 text-red-600">
          <span className="h-3 w-2.5 rounded-[2px] bg-red-500" />
          {counts.red}
        </span>
      )}
    </div>
  );
}

export default function MatchesPage() {
  // Defaults to a single category instead of "all" so the page doesn't load
  // and render every match across every category at once.
  const [categoryFilter, setCategoryFilter] = useState<LeagueCategoryValue | "all">(LEAGUE_CATEGORIES[0].value);
  const [statusFilter, setStatusFilter] = useState<MatchStatus | "">("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);
  const [registeringMatch, setRegisteringMatch] = useState<Match | null>(null);
  const [editingResultMatch, setEditingResultMatch] = useState<Match | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [viewingEvidenceMatch, setViewingEvidenceMatch] = useState<Match | null>(null);
  const [newMatchCategory, setNewMatchCategory] = useState<LeagueCategoryValue>(LEAGUE_CATEGORIES[0].value);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const { data: teamsData } = useTeams();
  const teams = teamsData?.data ?? [];
  const teamsById = Object.fromEntries(teams.map((t) => [t.id, t.name]));
  const teamCategoryById = Object.fromEntries(teams.map((t) => [t.id, t.category]));
  const teamsInCategory = teams.filter((t) => t.category === newMatchCategory);

  const { data: fieldsData } = useFields();
  const fields = fieldsData?.data ?? [];
  const fieldsById = Object.fromEntries(fields.map((f) => [f.id, f.name]));

  const isSearching = search.trim().length > 0;
  const { data, isLoading, isError } = useMatches({
    status: statusFilter || undefined,
    category: categoryFilter === "all" ? undefined : categoryFilter,
    page: isSearching ? 1 : page,
    pageSize: isSearching ? 100 : pageSize,
  });
  const matches = data?.data ?? [];
  const createMatch = useCreateMatch();

  const handleListCategoryChange = (value: LeagueCategoryValue | "all") => {
    setCategoryFilter(value);
    setPage(1);
  };

  const { data: cardsData } = useCards();
  const cardsByMatch = new Map<string, { yellow: number; red: number }>();
  for (const card of cardsData?.data ?? []) {
    const counts = cardsByMatch.get(card.matchId) ?? { yellow: 0, red: 0 };
    counts[card.type]++;
    cardsByMatch.set(card.matchId, counts);
  }

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<CreateMatchFormInput, unknown, CreateMatchFormOutput>({
    resolver: zodResolver(createMatchSchema),
  });

  const selectedHomeTeamId = watch("homeTeamId");
  const selectedAwayTeamId = watch("awayTeamId");
  const homeTeamOptions = teamsInCategory.filter((t) => t.id !== selectedAwayTeamId);
  const awayTeamOptions = teamsInCategory.filter((t) => t.id !== selectedHomeTeamId);

  // Proactively hide fields already booked for the chosen jornada/date/hora,
  // instead of only telling the admin after they hit "Crear partido".
  const watchedMatchday = Number(watch("matchday"));
  const watchedDate = watch("date");
  const watchedTime = watch("time");

  // Auto-fills the jornada from the chosen date: matches sharing the same
  // date belong to the same jornada, a later date starts the next one. Only
  // while the admin hasn't touched the field themselves — this is a
  // suggestion, still freely editable for edge cases (ej. reprogramaciones).
  const { data: latestMatchdayData } = useLatestMatchday();
  useEffect(() => {
    if (dirtyFields.matchday || !watchedDate) return;
    const latest = latestMatchdayData?.data;
    if (!latest) {
      setValue("matchday", 1);
      return;
    }
    const latestDate = latest.date.slice(0, 10);
    setValue("matchday", watchedDate > latestDate ? latest.matchday + 1 : latest.matchday);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedDate, latestMatchdayData]);
  const { data: matchdayMatchesData } = useMatches({
    matchday: watchedMatchday > 0 ? watchedMatchday : undefined,
    pageSize: 100,
  });
  const takenFieldIds = new Set(
    watchedTime
      ? (matchdayMatchesData?.data ?? [])
        .filter((m) => m.date.slice(0, 10) === watchedDate && m.time === watchedTime)
        .map((m) => m.fieldId)
      : []
  );
  const fieldOptions = fields.filter((f) => !takenFieldIds.has(f.id));

  const onSubmit = handleSubmit((values) => {
    createMatch.mutate(
      { ...values, time: values.time || undefined },
      {
        onSuccess: () => {
          toast.success("Partido creado");
          reset();
          setShowCreate(false);
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "No se pudo crear el partido"),
      }
    );
  });

  const handleCategoryChange = (category: LeagueCategoryValue) => {
    setNewMatchCategory(category);
    setValue("homeTeamId", "");
    setValue("awayTeamId", "");
  };

  const visibleMatches = matches.filter((match) => {
    if (!search.trim()) return true;
    const term = search.trim().toLowerCase();
    return (
      (teamsById[match.homeTeamId] ?? "").toLowerCase().includes(term) ||
      (teamsById[match.awayTeamId] ?? "").toLowerCase().includes(term) ||
      (fieldsById[match.fieldId] ?? "").toLowerCase().includes(term) ||
      String(match.matchday).includes(term)
    );
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink">Partidos</h1>
          <p className="text-sm text-muted">{data?.meta.totalItems ?? 0} partido(s) registrados.</p>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-56">
            <Field label="Buscar">
              <Input
                placeholder="Equipo, cancha o jornada..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Field>
          </div>
          <div className="w-48">
            <Field label="Filtrar por estatus">
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as MatchStatus | "");
                  setPage(1);
                }}
              >
                <option value="">Todos</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="w-56">
            <Field label="Categoría">
              <Select
                value={categoryFilter}
                onChange={(e) => handleListCategoryChange(e.target.value as LeagueCategoryValue | "all")}
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
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            Nuevo partido
          </Button>
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo partido">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label="Categoría">
            <Select
              value={newMatchCategory}
              onChange={(e) => handleCategoryChange(e.target.value as LeagueCategoryValue)}
            >
              {LEAGUE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          {teamsInCategory.length === 0 ? (
            <EmptyOptionsHint
              message="No hay equipos registrados en esta categoría."
              href="/admin/teams"
              linkLabel="Crea uno primero"
            />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Local" error={errors.homeTeamId?.message}>
                <Select {...register("homeTeamId")}>
                  <option value="">Selecciona...</option>
                  {homeTeamOptions.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Visitante" error={errors.awayTeamId?.message}>
                <Select {...register("awayTeamId")}>
                  <option value="">Selecciona...</option>
                  {awayTeamOptions.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          )}
          <Field label="Cancha" error={errors.fieldId?.message}>
            {fields.length === 0 ? (
              <EmptyOptionsHint
                message="No hay canchas registradas."
                href="/admin/fields"
                linkLabel="Crea una primero"
              />
            ) : fieldOptions.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-surface px-3 py-2 text-xs text-muted">
                Todas las canchas ya están ocupadas en esa jornada, fecha y hora.
              </p>
            ) : (
              <Select {...register("fieldId")}>
                <option value="">Selecciona...</option>
                {fieldOptions.map((field) => (
                  <option key={field.id} value={field.id}>
                    {field.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <div className="grid grid-cols-3 gap-4">
            <Field
              label="Jornada"
              error={errors.matchday?.message}
              hint={!dirtyFields.matchday ? "Sugerida según la fecha — editable." : undefined}
            >
              <Input type="number" min={1} onKeyDown={blockNonIntegerKeys} {...register("matchday")} />
            </Field>
            <Field label="Fecha" error={errors.date?.message}>
              <Input type="date" min={todayLocalISODate()} {...register("date")} />
            </Field>
            <Field label="Hora (opcional)" error={errors.time?.message}>
              <Select {...register("time")}>
                <option value="">Sin definir</option>
                {TIME_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={createMatch.isPending}>
              {createMatch.isPending ? "Creando..." : "Crear partido"}
            </Button>
          </div>
        </form>
      </Modal>

      <Card>
        <Table>
          <Thead>
            <Th>Jornada</Th>
            <Th>Encuentro</Th>
            <Th>Cancha</Th>
            <Th>Fecha</Th>
            <Th className="text-center">Marcador</Th>
            <Th className="text-center">Tarjetas</Th>
            <Th>Estatus</Th>
            <Th className="text-right">Acciones</Th>
          </Thead>
          <Tbody>
            {isLoading && <EmptyRow colSpan={8} message="Cargando..." />}
            {isError && <EmptyRow colSpan={8} message="No se pudo cargar la lista de partidos." />}
            {!isLoading && !isError && visibleMatches.length === 0 && (
              <EmptyRow colSpan={8} message="No hay partidos para este filtro." />
            )}
            {visibleMatches.map((match) => (
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
                <Td className="text-center">
                  {match.homeGoals !== null && match.awayGoals !== null ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="inline-flex items-center justify-center rounded-full bg-primary-light px-3 py-1 text-sm font-bold text-ink">
                        {match.homeGoals} - {match.awayGoals}
                      </span>
                      {match.forfeit && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
                          Ganado por default
                        </span>
                      )}
                      {match.forfeit && match.forfeitReason && (
                        <span className="max-w-[11rem] text-center text-[10px] leading-tight text-muted">
                          {match.forfeitReason}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted/60">—</span>
                  )}
                </Td>
                <Td className="text-center">
                  <CardsIndicator matchId={match.id} cardsByMatch={cardsByMatch} />
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
                    {!match.resultLocked && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Editar partido jornada ${match.matchday}`}
                        onClick={() => setEditingMatch(match)}
                      >
                        <Pencil size={16} />
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
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Corregir resultado de la jornada ${match.matchday}`}
                          title="Corregir marcador, tarjetas o evidencia (por si el árbitro se equivocó)"
                          onClick={() => setEditingResultMatch(match)}
                        >
                          <PencilLine size={16} />
                        </Button>
                        <span
                          className="flex items-center gap-1 rounded-full bg-primary-light px-2.5 py-1 text-[10px] font-bold uppercase text-primary"
                          title={
                            match.resultEditedAt
                              ? `Confirmado — corregido el ${new Date(match.resultEditedAt).toLocaleString("es-MX")}`
                              : "Resultado confirmado"
                          }
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
        <Pagination
          meta={data?.meta}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </Card>

      <EditMatchModal match={editingMatch} fields={fields} onClose={() => setEditingMatch(null)} />
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
      {editingResultMatch && (
        <RegisterResultForm
          match={{
            id: editingResultMatch.id,
            matchday: editingResultMatch.matchday,
            homeTeamId: editingResultMatch.homeTeamId,
            awayTeamId: editingResultMatch.awayTeamId,
            homeTeamName: teamsById[editingResultMatch.homeTeamId] ?? "Local",
            awayTeamName: teamsById[editingResultMatch.awayTeamId] ?? "Visitante",
          }}
          initialResult={{
            homeGoals: editingResultMatch.homeGoals ?? 0,
            awayGoals: editingResultMatch.awayGoals ?? 0,
            forfeit: editingResultMatch.forfeit,
            forfeitReason: editingResultMatch.forfeitReason,
          }}
          onDone={() => setEditingResultMatch(null)}
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
