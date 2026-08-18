"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  usePlayers,
  useCreatePlayer,
  useDeletePlayer,
  playerPhotoUrl,
  PLAYERS_PAGE_SIZE,
  type Player,
} from "@/hooks/usePlayers";
import { useTeams } from "@/hooks/useTeams";
import { ApiError } from "@/lib/errors";
import { formatCalendarDate } from "@/lib/utils/date";
import { Card } from "@/components/ui/card";
import { Table, Thead, Th, Tbody, Td, EmptyRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Avatar } from "@/components/ui/avatar";
import { PhotoInput } from "@/components/ui/photo-input";
import { Modal } from "@/components/ui/modal";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { EditPlayerModal, playerSchema, type PlayerForm } from "@/components/forms/EditPlayerModal";

export default function PlayersPage() {
  const [teamFilter, setTeamFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const { confirm, dialog } = useConfirm();

  const { data: teamsData } = useTeams();
  const teams = teamsData?.data ?? [];
  const teamsById = Object.fromEntries(teams.map((t) => [t.id, t.name]));

  const isSearching = search.trim().length > 0;
  const { data, isLoading, isError } = usePlayers({
    teamId: teamFilter || undefined,
    page: isSearching ? 1 : page,
    pageSize: isSearching ? 100 : PLAYERS_PAGE_SIZE,
  });
  const createPlayer = useCreatePlayer();
  const deletePlayer = useDeletePlayer();
  const term = search.trim().toLowerCase();
  const players = (data?.data ?? []).filter(
    (p) => !term || p.name.toLowerCase().includes(term) || p.registrationNumber.toLowerCase().includes(term)
  );

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
          setShowCreate(false);
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink">Jugadores</h1>
          <p className="text-sm text-muted">{data?.meta.totalItems ?? 0} jugador(es) registrados.</p>
        </div>
        <div className="w-56">
          <Field label="Buscar">
            <Input
              placeholder="Nombre o folio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Field>
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
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          Nuevo jugador
        </Button>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo jugador">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
          <Field label="Nombre" error={errors.name?.message}>
            <Input placeholder="Carlos Ramírez" maxLength={100} {...register("name")} />
          </Field>
          <Field label="Folio" error={errors.registrationNumber?.message}>
            <Input placeholder="TIG-004" maxLength={30} {...register("registrationNumber")} />
          </Field>
          <Field label="Nacimiento (opcional)" error={errors.birthDate?.message}>
            <Input type="date" {...register("birthDate")} />
          </Field>
          <Controller
            control={control}
            name="photo"
            render={({ field }) => (
              <PhotoInput value={field.value} onChange={field.onChange} uploading={createPlayer.isPending} />
            )}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={createPlayer.isPending}>
              {createPlayer.isPending ? "Creando..." : "Crear jugador"}
            </Button>
          </div>
        </form>
      </Modal>

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
                <Td>{player.birthDate ? formatCalendarDate(player.birthDate) : "—"}</Td>
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
