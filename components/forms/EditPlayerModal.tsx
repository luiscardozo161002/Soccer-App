"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useUpdatePlayer, playerPhotoUrl, type Player } from "@/hooks/usePlayers";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { ApiError } from "@/lib/errors";
import { Field, Input, Select } from "@/components/ui/field";
import { PhotoInput } from "@/components/ui/photo-input";
import { Modal } from "@/components/ui/modal";
import { EditFormFooter } from "@/components/ui/edit-form-footer";

export const playerSchema = z.object({
  teamId: z.string().uuid("Selecciona un equipo"),
  name: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  registrationNumber: z.string().trim().min(1, "El folio es obligatorio").max(30),
  birthDate: z.string().optional().or(z.literal("")),
  photo: z.string().optional(),
});
export type PlayerForm = z.infer<typeof playerSchema>;

export function EditPlayerModal({
  player,
  teams,
  onClose,
}: {
  player: Player | null;
  teams: { id: string; name: string }[];
  onClose: () => void;
}) {
  const updatePlayer = useUpdatePlayer();
  const [isEditing, setIsEditing] = useState(false);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<PlayerForm>({ resolver: zodResolver(playerSchema) });

  useUnsavedChangesWarning(isEditing && (isDirty || photoRemoved));

  const originalValues = player
    ? {
        teamId: player.teamId,
        name: player.name,
        registrationNumber: player.registrationNumber,
        birthDate: player.birthDate ? player.birthDate.slice(0, 10) : "",
        photo: undefined,
      }
    : null;

  useEffect(() => {
    if (originalValues) {
      reset(originalValues);
      setIsEditing(false);
      setPhotoRemoved(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, reset]);

  if (!player || !originalValues) return null;

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
    updatePlayer.mutate(
      {
        id: player.id,
        teamId: values.teamId,
        name: values.name,
        registrationNumber: values.registrationNumber,
        birthDate: values.birthDate || undefined,
        photo: photoRemoved ? null : values.photo,
      },
      {
        onSuccess: () => {
          toast.success("Jugador actualizado");
          handleClose();
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "No se pudo actualizar el jugador"),
      }
    );
  });

  return (
    <Modal open={!!player} onClose={handleClose} title="Editar jugador">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Equipo" error={errors.teamId?.message}>
          <Select disabled={!isEditing} {...register("teamId")}>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Nombre" error={errors.name?.message}>
          <Input maxLength={100} disabled={!isEditing} {...register("name")} />
        </Field>
        <Field label="Folio" error={errors.registrationNumber?.message}>
          <Input maxLength={30} disabled={!isEditing} {...register("registrationNumber")} />
        </Field>
        <Field label="Nacimiento (opcional)" error={errors.birthDate?.message}>
          <Input type="date" disabled={!isEditing} {...register("birthDate")} />
        </Field>
        <Controller
          control={control}
          name="photo"
          render={({ field }) => (
            <PhotoInput
              value={photoRemoved ? undefined : field.value ?? playerPhotoUrl(player) ?? undefined}
              onChange={(dataUrl) => {
                field.onChange(dataUrl);
                setPhotoRemoved(false);
              }}
              onRemove={() => {
                field.onChange(undefined);
                setPhotoRemoved(true);
              }}
              disabled={!isEditing}
              uploading={updatePlayer.isPending}
            />
          )}
        />
        <EditFormFooter
          isEditing={isEditing}
          isDirty={isDirty || photoRemoved}
          submitting={updatePlayer.isPending}
          onEdit={() => setIsEditing(true)}
          onCancel={handleCancel}
        />
      </form>
    </Modal>
  );
}
