"use client";

import { useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useUpdatePlayer, playerPhotoUrl, type Player } from "@/modules/players/hooks/usePlayers";
import type { Team } from "@/modules/teams/team.types";
import { ApiError } from "@/lib/errors";
import { LEAGUE_CATEGORIES, type LeagueCategoryValue } from "@/lib/constants/league-categories";
import { onlyDigits, withSanitizer } from "@/lib/utils/forms";
import { Field, Input, Select } from "@/components/ui/field";
import { EmptyOptionsHint } from "@/components/ui/empty-options-hint";
import { PhotoInput } from "@/components/ui/photo-input";
import { Modal } from "@/components/ui/modal";
import { EditFormFooter } from "@/components/ui/edit-form-footer";

export const playerSchema = z.object({
  teamId: z.string().uuid("Selecciona un equipo"),
  name: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  folioNumber: z.string().regex(/^\d{1,26}$/, "Ingresa solo dígitos (máximo 26)"),
  birthDate: z.string().optional().or(z.literal("")),
  photo: z.string().optional(),
});
export type PlayerForm = z.infer<typeof playerSchema>;

function playerFormValues(player: Player): PlayerForm {
  return {
    teamId: player.teamId,
    name: player.name,
    folioNumber: player.registrationNumber.match(/^[A-Z0-9]{3}-(\d+)$/)?.[1] ?? "",
    birthDate: player.birthDate ? player.birthDate.slice(0, 10) : "",
    photo: undefined,
  };
}

export function EditPlayerModal({
  player,
  teams,
  onClose,
}: {
  player: Player | null;
  teams: Pick<Team, "id" | "name" | "category" | "folioPrefix">[];
  onClose: () => void;
}) {
  if (!player) return null;
  return <EditPlayerModalContent key={player.id} player={player} teams={teams} onClose={onClose} />;
}

function EditPlayerModalContent({
  player,
  teams,
  onClose,
}: {
  player: Player;
  teams: Pick<Team, "id" | "name" | "category" | "folioPrefix">[];
  onClose: () => void;
}) {
  const updatePlayer = useUpdatePlayer();
  const [isEditing, setIsEditing] = useState(false);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [category, setCategory] = useState<LeagueCategoryValue | null>(null);
  const originalValues = playerFormValues(player);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<PlayerForm>({
    resolver: zodResolver(playerSchema),
    defaultValues: originalValues,
  });
  const selectedTeamId = useWatch({ control, name: "teamId" });
  const selectedTeam = teams.find((team) => team.id === selectedTeamId);
  const selectedCategory =
    category ?? teams.find((team) => team.id === player.teamId)?.category ?? LEAGUE_CATEGORIES[0].value;
  const teamsInCategory = teams.filter((team) => team.category === selectedCategory);

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  const handleCancel = () => {
    reset(originalValues);
    setCategory(null);
    setIsEditing(false);
    setPhotoRemoved(false);
  };

  const handleCategoryChange = (value: LeagueCategoryValue) => {
    setCategory(value);
    setValue("teamId", "", { shouldDirty: true, shouldValidate: true });
  };

  const onSubmit = handleSubmit((values) => {
    updatePlayer.mutate(
      {
        id: player.id,
        teamId: values.teamId,
        name: values.name,
        folioNumber: values.folioNumber,
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
        <Field label="Categoría">
          <Select
            disabled={!isEditing}
            value={selectedCategory}
            onChange={(event) => handleCategoryChange(event.target.value as LeagueCategoryValue)}
          >
            {LEAGUE_CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Equipo" error={errors.teamId?.message}>
          {teamsInCategory.length === 0 ? (
            <EmptyOptionsHint
              message="No hay equipos registrados en esta categoría."
              href="/admin/teams"
              linkLabel="Crea uno primero"
            />
          ) : (
            <Select disabled={!isEditing} {...register("teamId")}>
              <option value="">Selecciona...</option>
              {teamsInCategory.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Nombre" error={errors.name?.message}>
          <Input maxLength={100} disabled={!isEditing} {...register("name")} />
        </Field>
        <Field label="Folio" error={errors.folioNumber?.message} hint={selectedTeam && !selectedTeam.folioPrefix ? "Asigna un prefijo al equipo antes de guardar." : undefined}>
          <div className="flex items-center gap-2">
            <span className="min-w-12 font-semibold text-ink">{selectedTeam?.folioPrefix ?? "---"}-</span>
            <Input
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={26}
              aria-label="Dígitos del folio"
              disabled={!isEditing || !selectedTeam?.folioPrefix}
              {...withSanitizer(register("folioNumber"), onlyDigits)}
            />
          </div>
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
          isDirty={(isDirty || photoRemoved) && !!selectedTeam?.folioPrefix && selectedTeam.category === selectedCategory}
          submitting={updatePlayer.isPending}
          onEdit={() => setIsEditing(true)}
          onCancel={handleCancel}
        />
      </form>
    </Modal>
  );
}
