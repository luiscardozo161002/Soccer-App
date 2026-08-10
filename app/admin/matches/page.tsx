"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  useMatches,
  useCreateMatch,
  useUpdateMatch,
  MATCHES_PAGE_SIZE,
  type MatchStatus,
  type Match,
} from "@/hooks/useMatches";
import { useTeams } from "@/hooks/useTeams";
import { useFields } from "@/hooks/useFields";
import { useCards } from "@/hooks/useCards";
import { ApiError } from "@/lib/errors";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Table, Thead, Th, Tbody, Td, EmptyRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { RegisterResultForm } from "@/components/register-result-form";

const statusLabels: Record<MatchStatus, string> = {
  scheduled: "Programado",
  played: "Jugado",
  postponed: "Pospuesto",
  cancelled: "Cancelado",
};

const createMatchSchema = z
  .object({
    homeTeamId: z.string().uuid("Selecciona el equipo local"),
    awayTeamId: z.string().uuid("Selecciona el equipo visitante"),
    fieldId: z.string().uuid("Selecciona la cancha"),
    matchday: z.coerce.number().int().min(1, "Jornada inválida"),
    date: z.string().min(1, "La fecha es obligatoria"),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Formato HH:mm"),
  })
  .refine((data) => data.homeTeamId !== data.awayTeamId, {
    message: "El local y el visitante deben ser distintos",
    path: ["awayTeamId"],
  });
type CreateMatchFormInput = z.input<typeof createMatchSchema>;
type CreateMatchFormOutput = z.output<typeof createMatchSchema>;

const editMatchSchema = z.object({
  fieldId: z.string().uuid("Selecciona la cancha"),
  matchday: z.coerce.number().int().min(1, "Jornada inválida"),
  date: z.string().min(1, "La fecha es obligatoria"),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Formato HH:mm"),
  status: z.enum(["scheduled", "played", "postponed", "cancelled"]),
});
type EditMatchFormInput = z.input<typeof editMatchSchema>;
type EditMatchFormOutput = z.output<typeof editMatchSchema>;

function CardsIndicator({ matchId, cardsByMatch }: { matchId: string; cardsByMatch: Map<string, { yellow: number; red: number }> }) {
  const counts = cardsByMatch.get(matchId);
  if (!counts || (counts.yellow === 0 && counts.red === 0)) {
    return <span className="text-slate-300">—</span>;
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

function EditMatchModal({
  match,
  fields,
  onClose,
}: {
  match: Match | null;
  fields: { id: string; name: string }[];
  onClose: () => void;
}) {
  const updateMatch = useUpdateMatch();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditMatchFormInput, unknown, EditMatchFormOutput>({
    resolver: zodResolver(editMatchSchema),
  });

  useEffect(() => {
    if (match) {
      reset({
        fieldId: match.fieldId,
        matchday: match.matchday,
        date: match.date.slice(0, 10),
        time: match.time,
        status: match.status,
      });
    }
  }, [match, reset]);

  if (!match) return null;

  const onSubmit = handleSubmit((values) => {
    updateMatch.mutate(
      { id: match.id, ...values },
      {
        onSuccess: () => {
          toast.success("Partido actualizado");
          onClose();
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "No se pudo actualizar el partido"),
      }
    );
  });

  return (
    <Modal open={!!match} onClose={onClose} title="Editar partido">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Cancha" error={errors.fieldId?.message}>
          <Select {...register("fieldId")}>
            {fields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Jornada" error={errors.matchday?.message}>
            <Input type="number" min={1} {...register("matchday")} />
          </Field>
          <Field label="Estatus" error={errors.status?.message}>
            <Select {...register("status")}>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Fecha" error={errors.date?.message}>
            <Input type="date" {...register("date")} />
          </Field>
          <Field label="Hora" error={errors.time?.message}>
            <Input type="time" {...register("time")} />
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={updateMatch.isPending}>
            {updateMatch.isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function MatchesPage() {
  const [statusFilter, setStatusFilter] = useState<MatchStatus | "">("");
  const [page, setPage] = useState(1);
  const [editingResultId, setEditingResultId] = useState<string | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  const { data: teamsData } = useTeams();
  const teams = teamsData?.data ?? [];
  const teamsById = Object.fromEntries(teams.map((t) => [t.id, t.name]));

  const { data: fieldsData } = useFields();
  const fields = fieldsData?.data ?? [];
  const fieldsById = Object.fromEntries(fields.map((f) => [f.id, f.name]));

  const { data, isLoading, isError } = useMatches({
    status: statusFilter || undefined,
    page,
    pageSize: MATCHES_PAGE_SIZE,
  });
  const matches = data?.data ?? [];
  const createMatch = useCreateMatch();

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
    formState: { errors },
  } = useForm<CreateMatchFormInput, unknown, CreateMatchFormOutput>({
    resolver: zodResolver(createMatchSchema),
  });

  const onSubmit = handleSubmit((values) => {
    createMatch.mutate(values, {
      onSuccess: () => {
        toast.success("Partido creado");
        reset();
      },
      onError: (error) =>
        toast.error(error instanceof ApiError ? error.message : "No se pudo crear el partido"),
    });
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Partidos</h1>
          <p className="text-sm text-slate-500">{data?.meta.totalItems ?? 0} partido(s) registrados.</p>
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
      </div>

      <Card>
        <CardHeader title="Nuevo partido" />
        <CardBody>
          <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-4">
            <div className="w-44">
              <Field label="Local" error={errors.homeTeamId?.message}>
                <Select {...register("homeTeamId")}>
                  <option value="">Selecciona...</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="w-44">
              <Field label="Visitante" error={errors.awayTeamId?.message}>
                <Select {...register("awayTeamId")}>
                  <option value="">Selecciona...</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="w-44">
              <Field label="Cancha" error={errors.fieldId?.message}>
                <Select {...register("fieldId")}>
                  <option value="">Selecciona...</option>
                  {fields.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="w-24">
              <Field label="Jornada" error={errors.matchday?.message}>
                <Input type="number" min={1} {...register("matchday")} />
              </Field>
            </div>
            <div className="w-40">
              <Field label="Fecha" error={errors.date?.message}>
                <Input type="date" {...register("date")} />
              </Field>
            </div>
            <div className="w-28">
              <Field label="Hora" error={errors.time?.message}>
                <Input type="time" {...register("time")} />
              </Field>
            </div>
            <Button type="submit" disabled={createMatch.isPending}>
              {createMatch.isPending ? "Creando..." : "Crear partido"}
            </Button>
          </form>
        </CardBody>
      </Card>

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
            {!isLoading && !isError && matches.length === 0 && (
              <EmptyRow colSpan={8} message="No hay partidos para este filtro." />
            )}
            {matches.map((match) => (
              <tr key={match.id}>
                <Td>
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                    {match.matchday}
                  </span>
                </Td>
                <Td>
                  <div className="flex flex-col text-sm">
                    <span className="font-semibold text-ink">{teamsById[match.homeTeamId] ?? "—"}</span>
                    <span className="text-xs text-slate-400">vs</span>
                    <span className="font-semibold text-ink">{teamsById[match.awayTeamId] ?? "—"}</span>
                  </div>
                </Td>
                <Td>{fieldsById[match.fieldId] ?? "—"}</Td>
                <Td>
                  {new Date(match.date).toLocaleDateString("es-MX")}
                  <span className="text-slate-400"> · {match.time}</span>
                </Td>
                <Td className="text-center">
                  {match.homeGoals !== null && match.awayGoals !== null ? (
                    <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-ink">
                      {match.homeGoals} - {match.awayGoals}
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </Td>
                <Td className="text-center">
                  <CardsIndicator matchId={match.id} cardsByMatch={cardsByMatch} />
                </Td>
                <Td>
                  <Badge tone={match.status}>{statusLabels[match.status]}</Badge>
                </Td>
                <Td className="text-right">
                  {editingResultId === match.id ? (
                    <RegisterResultForm matchId={match.id} onDone={() => setEditingResultId(null)} />
                  ) : (
                    <div className="flex justify-end gap-1">
                      {match.status === "scheduled" && (
                        <Button variant="secondary" onClick={() => setEditingResultId(match.id)}>
                          Registrar resultado
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Editar partido jornada ${match.matchday}`}
                        onClick={() => setEditingMatch(match)}
                      >
                        <Pencil size={16} />
                      </Button>
                    </div>
                  )}
                </Td>
              </tr>
            ))}
          </Tbody>
        </Table>
        <Pagination meta={data?.meta} onPageChange={setPage} />
      </Card>

      <EditMatchModal match={editingMatch} fields={fields} onClose={() => setEditingMatch(null)} />
    </div>
  );
}
