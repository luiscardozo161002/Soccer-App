"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useUpdateCupMatch, type CupMatch } from "@/hooks/useCupMatches";
import { useFields } from "@/hooks/useFields";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { ApiError } from "@/lib/errors";
import { Field, Input, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { EditFormFooter } from "@/components/ui/edit-form-footer";

const statusLabels = {
  scheduled: "Programado",
  postponed: "Pospuesto",
  cancelled: "Cancelado",
} as const;
const editableStatuses = ["scheduled", "postponed", "cancelled"] as const;

const editCupMatchSchema = z.object({
  round: z.string().trim().min(1, "La ronda es obligatoria").max(80),
  fieldId: z.string().optional(),
  date: z.string().min(1, "La fecha es obligatoria"),
  time: z.string().optional(),
  status: z.enum(editableStatuses),
});
type EditCupMatchForm = z.infer<typeof editCupMatchSchema>;

export function EditCupMatchModal({ match, onClose }: { match: CupMatch | null; onClose: () => void }) {
  const updateMatch = useUpdateCupMatch();
  const { data: fieldsData } = useFields();
  const fields = fieldsData?.data ?? [];
  const [isEditing, setIsEditing] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditCupMatchForm>({ resolver: zodResolver(editCupMatchSchema) });

  useUnsavedChangesWarning(isEditing && isDirty);

  const originalValues = match
    ? {
        round: match.round,
        fieldId: match.fieldId ?? "",
        date: match.date.slice(0, 10),
        time: match.time ?? "",
        status: (match.status === "played" ? "scheduled" : match.status) as EditCupMatchForm["status"],
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

  const onSubmit = handleSubmit((values) => {
    updateMatch.mutate(
      {
        id: match.id,
        round: values.round,
        fieldId: values.fieldId || undefined,
        date: values.date,
        time: values.time || undefined,
        status: values.status,
      },
      {
        onSuccess: () => {
          toast.success("Partido de copa actualizado");
          handleClose();
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "No se pudo actualizar el partido"),
      }
    );
  });

  return (
    <Modal
      open={!!match}
      onClose={handleClose}
      title="Editar partido de copa"
      description={`${match.homeTeam.name} vs ${match.awayTeam.name}`}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Ronda" error={errors.round?.message}>
          <Input disabled={!isEditing} {...register("round")} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Cancha (opcional)" error={errors.fieldId?.message}>
            <Select disabled={!isEditing} {...register("fieldId")}>
              <option value="">Sin definir</option>
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </Select>
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
            <Input type="time" disabled={!isEditing} {...register("time")} />
          </Field>
        </div>
        <EditFormFooter
          isEditing={isEditing}
          isDirty={isDirty}
          submitting={updateMatch.isPending}
          onEdit={() => setIsEditing(true)}
          onCancel={handleCancel}
        />
      </form>
    </Modal>
  );
}
