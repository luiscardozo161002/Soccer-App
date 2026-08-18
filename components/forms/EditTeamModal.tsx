"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useUpdateTeam, teamPhotoUrl, type Team } from "@/hooks/useTeams";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
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
});
export type TeamForm = z.infer<typeof teamSchema>;

export function EditTeamModal({ team, onClose }: { team: Team | null; onClose: () => void }) {
  const updateTeam = useUpdateTeam();
  const [isEditing, setIsEditing] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<TeamForm>({ resolver: zodResolver(teamSchema) });

  useUnsavedChangesWarning(isEditing && isDirty);

  useEffect(() => {
    if (team) {
      reset({ name: team.name, category: team.category, photo: undefined });
      setIsEditing(false);
    }
  }, [team, reset]);

  if (!team) return null;

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  const handleCancel = () => {
    reset({ name: team.name, category: team.category, photo: undefined });
    setIsEditing(false);
  };

  const onSubmit = handleSubmit((values) => {
    updateTeam.mutate(
      { id: team.id, name: values.name, category: values.category, photo: values.photo },
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
        <Controller
          control={control}
          name="photo"
          render={({ field }) => (
            <PhotoInput
              value={field.value ?? teamPhotoUrl(team) ?? undefined}
              onChange={field.onChange}
              disabled={!isEditing}
              uploading={updateTeam.isPending}
            />
          )}
        />
        <EditFormFooter
          isEditing={isEditing}
          isDirty={isDirty}
          submitting={updateTeam.isPending}
          onEdit={() => setIsEditing(true)}
          onCancel={handleCancel}
        />
      </form>
    </Modal>
  );
}
