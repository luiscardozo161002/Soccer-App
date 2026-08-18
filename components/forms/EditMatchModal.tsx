"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useUpdateMatch, type MatchStatus, type Match } from "@/hooks/useMatches";
import { ApiError } from "@/lib/errors";
import { todayLocalISODate } from "@/lib/utils/date";
import { matchTimeOptions, isWithinMatchTimeWindow } from "@/lib/constants/match-time";
import { blockNonIntegerKeys } from "@/lib/utils/forms";
import { Field, Input, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { EditFormFooter } from "@/components/ui/edit-form-footer";

export const statusLabels: Record<MatchStatus, string> = {
  scheduled: "Programado",
  played: "Jugado",
  postponed: "Pospuesto",
  cancelled: "Cancelado",
};

// Status changes made via the edit form can only land on these — "played"
// is only reachable through /result (register result), which also demands
// a time, so a match can never end up "played" without a score.
const editableStatuses = ["scheduled", "postponed", "cancelled"] as const;

export function isDateNotBeforeToday(date: string) {
  return date.slice(0, 10) >= todayLocalISODate();
}

export const timeFieldSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Formato HH:mm")
  .refine(isWithinMatchTimeWindow, {
    message: "La hora debe estar entre 9:00 a. m. y 4:00 p. m.",
  })
  .optional()
  .or(z.literal(""));

// Computed once: the dropdown only ever offers valid 9:00-16:00 slots, so
// there's nothing for the picker itself to filter or validate against.
export const TIME_OPTIONS = matchTimeOptions();

export const editMatchSchema = z
  .object({
    fieldId: z.string().uuid("Selecciona la cancha"),
    matchday: z.coerce.number().int().min(1, "Jornada inválida"),
    date: z.string().min(1, "La fecha es obligatoria"),
    time: timeFieldSchema,
    status: z.enum(editableStatuses),
    statusReason: z.string().trim().max(300).optional().or(z.literal("")),
  })
  .refine((data) => data.status !== "scheduled" || isDateNotBeforeToday(data.date), {
    message: "La fecha no puede ser anterior a hoy",
    path: ["date"],
  })
  .refine(
    (data) => data.status === "scheduled" || (!!data.statusReason && data.statusReason.trim().length > 0),
    {
      message: "Indica el motivo",
      path: ["statusReason"],
    }
  );
type EditMatchFormInput = z.input<typeof editMatchSchema>;
type EditMatchFormOutput = z.output<typeof editMatchSchema>;

export function EditMatchModal({
  match,
  fields,
  onClose,
}: {
  match: Match | null;
  fields: { id: string; name: string }[];
  onClose: () => void;
}) {
  const updateMatch = useUpdateMatch();
  const { confirm, dialog } = useConfirm();
  const [isEditing, setIsEditing] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<EditMatchFormInput, unknown, EditMatchFormOutput>({
    resolver: zodResolver(editMatchSchema),
  });
  const watchedStatus = watch("status");
  const needsReason = watchedStatus === "postponed" || watchedStatus === "cancelled";

  const originalValues = match
    ? {
        fieldId: match.fieldId,
        matchday: match.matchday,
        date: match.date.slice(0, 10),
        time: match.time ?? "",
        status: (match.status === "played" ? "scheduled" : match.status) as EditMatchFormInput["status"],
        statusReason: match.statusReason ?? "",
      }
    : null;

  useEffect(() => {
    if (originalValues) {
      reset(originalValues);
      setIsEditing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match, reset]);

  if (!match || !originalValues) return null;

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  const handleCancel = () => {
    reset(originalValues);
    setIsEditing(false);
  };

  const onSubmit = handleSubmit(async (values) => {
    if (match.status === "scheduled" && values.status !== "scheduled") {
      const ok = await confirm({
        title: "¿Confirmar el nuevo estatus?",
        description: `Vas a cambiar este partido de "Programado" a "${statusLabels[values.status]}". ¿Estás seguro de que es correcto?`,
        confirmLabel: "Sí, cambiar estatus",
        tone: "primary",
      });
      if (!ok) return;
    }
    updateMatch.mutate(
      {
        id: match.id,
        ...values,
        time: values.time || undefined,
        statusReason: values.statusReason || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Partido actualizado");
          handleClose();
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "No se pudo actualizar el partido"),
      }
    );
  });

  return (
    <>
      <Modal open={!!match} onClose={handleClose} title="Editar partido">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label="Cancha" error={errors.fieldId?.message}>
            <Select disabled={!isEditing} {...register("fieldId")}>
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Jornada" error={errors.matchday?.message}>
              <Input
                type="number"
                min={1}
                onKeyDown={blockNonIntegerKeys}
                disabled={!isEditing}
                {...register("matchday")}
              />
            </Field>
            <Field label="Estatus" error={errors.status?.message}>
              <Select disabled={!isEditing} {...register("status")}>
                {editableStatuses.map((value) => (
                  <option key={value} value={value}>
                    {statusLabels[value]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Fecha" error={errors.date?.message}>
              <Input type="date" disabled={!isEditing} {...register("date")} />
            </Field>
            <Field label="Hora (opcional)" error={errors.time?.message}>
              <Select disabled={!isEditing} {...register("time")}>
                <option value="">Sin definir</option>
                {TIME_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          {needsReason && (
            <Field
              label={watchedStatus === "postponed" ? "Motivo del aplazamiento" : "Motivo de la cancelación"}
              error={errors.statusReason?.message}
            >
              <Input
                placeholder="Ej. lluvia, agresión entre jugadores, cancha no disponible..."
                maxLength={300}
                disabled={!isEditing}
                {...register("statusReason")}
              />
            </Field>
          )}
          <p className="text-xs text-muted">
            La hora debe registrarse antes de poder marcar el resultado del partido.
          </p>
          <EditFormFooter
            isEditing={isEditing}
            isDirty={isDirty}
            submitting={updateMatch.isPending}
            onEdit={() => setIsEditing(true)}
            onCancel={handleCancel}
          />
        </form>
      </Modal>
      {dialog}
    </>
  );
}
