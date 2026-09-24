"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useUpdateTeam, teamPhotoUrl, type Team } from "@/modules/teams/hooks/useTeams";
import { ApiError } from "@/lib/errors";
import { LEAGUE_CATEGORIES, type LeagueCategoryValue } from "@/lib/constants/league-categories";
import { Field, Input, Select } from "@/components/ui/field";
import { PhotoInput } from "@/components/ui/photo-input";
import { Modal } from "@/components/ui/modal";
import { EditFormFooter } from "@/components/ui/edit-form-footer";

const categoryValues = LEAGUE_CATEGORIES.map((c) => c.value) as [
  LeagueCategoryValue,
  ...LeagueCategoryValue[],
];

export const teamSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  category: z.enum(categoryValues),
  photo: z.string().optional(),
  folioPrefix: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{3}$/, "Debe ser exactamente 3 caracteres"),
});
export type TeamForm = z.infer<typeof teamSchema>;

export function EditTeamModal({ team, onClose }: { team: Team | null; onClose: () => void }) {
  if (!team) return null;
  return <EditTeamModalContent key={team.id} team={team} onClose={onClose} />;
}

function EditTeamModalContent({ team, onClose }: { team: Team; onClose: () => void }) {
  const updateTeam = useUpdateTeam();
  const [isEditing, setIsEditing] = useState(false);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const originalValues: TeamForm = {
    name: team.name,
    category: team.category,
    photo: undefined,
    folioPrefix: team.folioPrefix ?? "",
  };
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<TeamForm>({
    resolver: zodResolver(teamSchema),
    defaultValues: originalValues,
  });

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  const handleCancel = () => {
    reset(originalValues);
    setIsEditing(false);
    setPhotoRemoved(false);
  };

  const onSubmit = handleSubmit((values) => {
    updateTeam.mutate(
      {
        id: team.id,
        name: values.name,
        category: values.category,
        folioPrefix: values.folioPrefix,
        photo: photoRemoved ? null : values.photo,
      },
      {
        onSuccess: () => {
          toast.success("Equipo actualizado");
          handleClose();
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "No se pudo actualizar el equipo"),
      }
    );
  });

  return (
    <Modal open={!!team} onClose={handleClose} title="Editar equipo">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Nombre" error={errors.name?.message}>
          <Input maxLength={100} disabled={!isEditing} {...register("name")} />
        </Field>
        <Field label="Categoría" error={errors.category?.message}>
          <Select disabled={!isEditing} {...register("category")}>
            {LEAGUE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Prefijo de folio"
          error={errors.folioPrefix?.message}
          hint="3 caracteres, ej. TIG. Se usa para generar el folio de cada jugador (TIG-001, TIG-002...)."
        >
          <Input maxLength={3} className="uppercase" disabled={!isEditing} {...register("folioPrefix")} />
        </Field>
        <Controller
          control={control}
          name="photo"
          render={({ field }) => (
            <PhotoInput
              value={photoRemoved ? undefined : field.value ?? teamPhotoUrl(team) ?? undefined}
              onChange={(dataUrl) => {
                field.onChange(dataUrl);
                setPhotoRemoved(false);
              }}
              onRemove={() => {
                field.onChange(undefined);
                setPhotoRemoved(true);
              }}
              disabled={!isEditing}
              uploading={updateTeam.isPending}
            />
          )}
        />
        <EditFormFooter
          isEditing={isEditing}
          isDirty={isDirty || photoRemoved}
          submitting={updateTeam.isPending}
          onEdit={() => setIsEditing(true)}
          onCancel={handleCancel}
        />
      </form>
    </Modal>
  );
}
