"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  usePlayers,
  useCreatePlayer,
  useUpdatePlayer,
  useDeletePlayer,
  playerPhotoUrl,
  PLAYERS_PAGE_SIZE,
  type Player,
} from "@/hooks/usePlayers";
import { useTeams } from "@/hooks/useTeams";
import { ApiError } from "@/lib/errors";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Table, Thead, Th, Tbody, Td, EmptyRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Avatar } from "@/components/ui/avatar";
import { PhotoInput } from "@/components/ui/photo-input";
import { Modal } from "@/components/ui/modal";
import { useConfirm } from "@/components/ui/confirm-dialog";

const playerSchema = z.object({
  teamId: z.string().uuid("Selecciona un equipo"),
  name: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  registrationNumber: z.string().trim().min(1, "El folio es obligatorio").max(30),
  birthDate: z.string().optional().or(z.literal("")),
  photo: z.string().optional(),
});
type PlayerForm = z.infer<typeof playerSchema>;

function EditPlayerModal({
  player,
  teams,
  onClose,
}: {
  player: Player | null;
  teams: { id: string; name: string }[];
  onClose: () => void;
}) {
  const updatePlayer = useUpdatePlayer();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PlayerForm>({ resolver: zodResolver(playerSchema) });

  useEffect(() => {
    if (player) {
      reset({
        teamId: player.teamId,
        name: player.name,
        registrationNumber: player.registrationNumber,
        birthDate: player.birthDate ? player.birthDate.slice(0, 10) : "",
        photo: undefined,
      });
    }
  }, [player, reset]);

  if (!player) return null;

  const onSubmit = handleSubmit((values) => {
    updatePlayer.mutate(
      {
        id: player.id,
        teamId: values.teamId,
        name: values.name,
        registrationNumber: values.registrationNumber,
        birthDate: values.birthDate || undefined,
        photo: values.photo,
      },
      {
        onSuccess: () => {
          toast.success("Jugador actualizado");
          onClose();
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "No se pudo actualizar el jugador"),
      }
    );
  });

  return (
    <Modal open={!!player} onClose={onClose} title="Editar jugador">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Equipo" error={errors.teamId?.message}>
          <Select {...register("teamId")}>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Nombre" error={errors.name?.message}>
          <Input {...register("name")} />
        </Field>
        <Field label="Folio" error={errors.registrationNumber?.message}>
          <Input {...register("registrationNumber")} />
        </Field>
        <Field label="Nacimiento (opcional)" error={errors.birthDate?.message}>
          <Input type="date" {...register("birthDate")} />
        </Field>
        <Controller
          control={control}
          name="photo"
          render={({ field }) => (
            <PhotoInput value={field.value ?? playerPhotoUrl(player) ?? undefined} onChange={field.onChange} />
          )}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={updatePlayer.isPending}>
            {updatePlayer.isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function PlayersPage() {
  const [teamFilter, setTeamFilter] = useState("");
  const [page, setPage] = useState(1);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const { confirm, dialog } = useConfirm();

  const { data: teamsData } = useTeams();
  const teams = teamsData?.data ?? [];
  const teamsById = Object.fromEntries(teams.map((t) => [t.id, t.name]));

  const { data, isLoading, isError } = usePlayers({
    teamId: teamFilter || undefined,
    page,
    pageSize: PLAYERS_PAGE_SIZE,
  });
  const createPlayer = useCreatePlayer();
  const deletePlayer = useDeletePlayer();
  const players = data?.data ?? [];

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PlayerForm>({ resolver: zodResolver(playerSchema) });

  const onSubmit = handleSubmit((values) => {
    createPlayer.mutate(
      {
        teamId: values.teamId,
        name: values.name,
        registrationNumber: values.registrationNumber,
        birthDate: values.birthDate || undefined,
        photo: values.photo,
      },
      {
        onSuccess: () => {
          toast.success(`Jugador "${values.name}" creado`);
          reset();
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "No se pudo crear el jugador"),
      }
    );
  });

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: `¿Eliminar al jugador "${name}"?`,
      description: "Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
    });
    if (!ok) return;
    deletePlayer.mutate(id, {
      onSuccess: () => toast.success("Jugador eliminado"),
      onError: (error) =>
        toast.error(error instanceof ApiError ? error.message : "No se pudo eliminar el jugador"),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Jugadores</h1>
          <p className="text-sm text-slate-500">{data?.meta.totalItems ?? 0} jugador(es) registrados.</p>
        </div>
        <div className="w-56">
          <Field label="Filtrar por equipo">
            <Select
              value={teamFilter}
              onChange={(e) => {
                setTeamFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos los equipos</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      <Card>
        <CardHeader title="Nuevo jugador" />
        <CardBody>
          <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-4">
            <div className="w-52">
              <Field label="Equipo" error={errors.teamId?.message}>
                <Select {...register("teamId")}>
                  <option value="">Selecciona...</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="w-52">
              <Field label="Nombre" error={errors.name?.message}>
                <Input placeholder="Carlos Ramírez" {...register("name")} />
              </Field>
            </div>
            <div className="w-36">
              <Field label="Folio" error={errors.registrationNumber?.message}>
                <Input placeholder="TIG-004" {...register("registrationNumber")} />
              </Field>
            </div>
            <div className="w-40">
              <Field label="Nacimiento (opcional)" error={errors.birthDate?.message}>
                <Input type="date" {...register("birthDate")} />
              </Field>
            </div>
            <Controller
              control={control}
              name="photo"
              render={({ field }) => <PhotoInput value={field.value} onChange={field.onChange} />}
            />
            <Button type="submit" disabled={createPlayer.isPending}>
              {createPlayer.isPending ? "Creando..." : "Crear jugador"}
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <Table>
          <Thead>
            <Th>Jugador</Th>
            <Th>Equipo</Th>
            <Th>Folio</Th>
            <Th>Nacimiento</Th>
            <Th className="text-right">Acciones</Th>
          </Thead>
          <Tbody>
            {isLoading && <EmptyRow colSpan={5} message="Cargando..." />}
            {isError && <EmptyRow colSpan={5} message="No se pudo cargar la lista de jugadores." />}
            {!isLoading && !isError && players.length === 0 && (
              <EmptyRow colSpan={5} message="No hay jugadores para este filtro." />
            )}
            {players.map((player) => (
              <tr key={player.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar src={playerPhotoUrl(player)} name={player.name} />
                    <span className="font-semibold text-ink">{player.name}</span>
                  </div>
                </Td>
                <Td>{teamsById[player.teamId] ?? "—"}</Td>
                <Td>{player.registrationNumber}</Td>
                <Td>{player.birthDate ? new Date(player.birthDate).toLocaleDateString("es-MX") : "—"}</Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar ${player.name}`}
                      onClick={() => setEditingPlayer(player)}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Eliminar ${player.name}`}
                      onClick={() => handleDelete(player.id, player.name)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </Tbody>
        </Table>
        <Pagination meta={data?.meta} onPageChange={setPage} />
      </Card>

      <EditPlayerModal player={editingPlayer} teams={teams} onClose={() => setEditingPlayer(null)} />
      {dialog}
    </div>
  );
}
