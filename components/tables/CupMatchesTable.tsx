"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Lock, Plus, RotateCcw } from "lucide-react";
import { useCupMatches, useCreateCupMatch, useReopenCupMatch, type CupMatch } from "@/hooks/useCupMatches";
import { useCupEntries } from "@/hooks/useCupEntries";
import { useFields } from "@/hooks/useFields";
import { ApiError } from "@/lib/errors";
import { formatCalendarDate } from "@/lib/utils/date";
import { Card, CardHeader } from "@/components/ui/card";
import { Table, Thead, Th, Tbody, Td, EmptyRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { EditCupMatchModal } from "@/components/forms/EditCupMatchModal";
import { RegisterCupResultForm } from "@/components/forms/RegisterCupResultForm";

const statusLabels: Record<CupMatch["status"], string> = {
  scheduled: "Programado",
  played: "Jugado",
  postponed: "Pospuesto",
  cancelled: "Cancelado",
};

const createCupMatchSchema = z
  .object({
    round: z.string().trim().min(1, "La ronda es obligatoria").max(80),
    homeTeamId: z.string().uuid("Selecciona el equipo local"),
    awayTeamId: z.string().uuid("Selecciona el equipo visitante"),
    fieldId: z.string().optional(),
    date: z.string().min(1, "La fecha es obligatoria"),
    time: z.string().optional(),
  })
  .refine((data) => data.homeTeamId !== data.awayTeamId, {
    message: "El local y el visitante deben ser distintos",
    path: ["awayTeamId"],
  });
type CreateCupMatchForm = z.infer<typeof createCupMatchSchema>;

export function CupMatchesTable({ cupId }: { cupId: string }) {
  const [roundFilter, setRoundFilter] = useState("");
  const { data, isLoading, isError } = useCupMatches({ cupId, round: roundFilter || undefined });
  const matches = data?.data ?? [];
  const { data: entriesData } = useCupEntries(cupId);
  const activeTeams = (entriesData?.data ?? []).filter((e) => e.status === "active").map((e) => e.team);
  const { data: fieldsData } = useFields();
  const fields = fieldsData?.data ?? [];

  const rounds = [...new Set(matches.map((m) => m.round))];

  const [showCreate, setShowCreate] = useState(false);
  const [editingMatch, setEditingMatch] = useState<CupMatch | null>(null);
  const [registeringMatch, setRegisteringMatch] = useState<CupMatch | null>(null);
  const createMatch = useCreateCupMatch();
  const reopenMatch = useReopenCupMatch();
  const { confirm, dialog } = useConfirm();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateCupMatchForm>({ resolver: zodResolver(createCupMatchSchema) });
  const selectedHome = watch("homeTeamId");
  const selectedAway = watch("awayTeamId");
  const homeOptions = activeTeams.filter((t) => t.id !== selectedAway);
  const awayOptions = activeTeams.filter((t) => t.id !== selectedHome);

  const onSubmit = handleSubmit((values) => {
    createMatch.mutate(
      { cupId, ...values, fieldId: values.fieldId || undefined, time: values.time || undefined },
      {
        onSuccess: () => {
          toast.success("Partido de copa creado");
          reset();
          setShowCreate(false);
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "No se pudo crear el partido"),
      }
    );
  });

  const handleReopen = async (match: CupMatch) => {
    const ok = await confirm({
      title: "¿Reabrir este resultado?",
      description:
        "El marcador se borra, el partido vuelve a estar programado, y ambos equipos regresan a estar activos en la copa (si alguno había quedado eliminado por este resultado).",
      confirmLabel: "Reabrir resultado",
      tone: "danger",
    });
    if (!ok) return;
    reopenMatch.mutate(match.id, {
      onSuccess: () => toast.success("Resultado reabierto"),
      onError: (error) =>
        toast.error(
          error instanceof ApiError
            ? error.message
            : "No se pudo reabrir — ya se emparejó a alguno de estos equipos en otro partido"
        ),
    });
  };

  return (
    <Card>
      <CardHeader
        title="Partidos"
        description={`${matches.length} partido(s)${roundFilter ? ` en "${roundFilter}"` : ""}.`}
        action={
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-48">
              <Field label="Filtrar por ronda">
                <Select value={roundFilter} onChange={(e) => setRoundFilter(e.target.value)}>
                  <option value="">Todas</option>
                  {rounds.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Button onClick={() => setShowCreate(true)} disabled={activeTeams.length < 2}>
              <Plus size={16} />
              Nuevo partido de copa
            </Button>
          </div>
        }
      />

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo partido de copa">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label="Ronda" error={errors.round?.message}>
            <Input placeholder="Primera Ronda" maxLength={80} {...register("round")} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Local" error={errors.homeTeamId?.message}>
              <Select {...register("homeTeamId")}>
                <option value="">Selecciona...</option>
                {homeOptions.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Visitante" error={errors.awayTeamId?.message}>
              <Select {...register("awayTeamId")}>
                <option value="">Selecciona...</option>
                {awayOptions.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Cancha (opcional)">
              <Select {...register("fieldId")}>
                <option value="">Sin definir</option>
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Fecha" error={errors.date?.message}>
              <Input type="date" {...register("date")} />
            </Field>
            <Field label="Hora (opcional)">
              <Input type="time" {...register("time")} />
            </Field>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={createMatch.isPending}>
              {createMatch.isPending ? "Creando..." : "Crear partido"}
            </Button>
          </div>
        </form>
      </Modal>

      <Table>
        <Thead>
          <Th>Ronda</Th>
          <Th>Encuentro</Th>
          <Th>Fecha</Th>
          <Th className="text-center">Marcador</Th>
          <Th>Estatus</Th>
          <Th className="text-right">Acciones</Th>
        </Thead>
        <Tbody>
          {isLoading && <EmptyRow colSpan={6} message="Cargando..." />}
          {isError && <EmptyRow colSpan={6} message="No se pudo cargar la lista de partidos." />}
          {!isLoading && !isError && matches.length === 0 && (
            <EmptyRow colSpan={6} message="Todavía no hay partidos en esta copa." />
          )}
          {matches.map((match) => (
            <tr key={match.id}>
              <Td className="text-sm text-muted">{match.round}</Td>
              <Td>
                <div className="flex flex-col gap-0.5 text-sm">
                  <span className="font-semibold text-ink">{match.homeTeam.name}</span>
                  <span className="text-xs text-muted">vs</span>
                  <span className="font-semibold text-ink">{match.awayTeam.name}</span>
                </div>
              </Td>
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
                  </div>
                ) : (
                  <span className="text-muted/60">—</span>
                )}
              </Td>
              <Td>
                <Badge tone={match.status}>{statusLabels[match.status]}</Badge>
              </Td>
              <Td className="text-right">
                <div className="flex justify-end gap-1">
                  {!match.resultLocked && match.status === "scheduled" && (
                    <Button variant="secondary" onClick={() => setRegisteringMatch(match)}>
                      Registrar resultado
                    </Button>
                  )}
                  {!match.resultLocked && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar partido ${match.homeTeam.name} vs ${match.awayTeam.name}`}
                      onClick={() => setEditingMatch(match)}
                    >
                      <Pencil size={16} />
                    </Button>
                  )}
                  {match.resultLocked && (
                    <>
                      <span
                        className="flex items-center gap-1 rounded-full bg-primary-light px-2.5 py-1 text-[10px] font-bold uppercase text-primary"
                        title="Resultado confirmado"
                      >
                        <Lock size={12} />
                        Confirmado
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Reabrir resultado"
                        title="Reabrir resultado"
                        onClick={() => handleReopen(match)}
                      >
                        <RotateCcw size={16} />
                      </Button>
                    </>
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </Tbody>
      </Table>

      <EditCupMatchModal match={editingMatch} onClose={() => setEditingMatch(null)} />
      {registeringMatch && (
        <RegisterCupResultForm match={registeringMatch} onDone={() => setRegisteringMatch(null)} />
      )}
      {dialog}
    </Card>
  );
}
