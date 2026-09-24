"use client";

import { useState } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  usePlayers,
  useCreatePlayer,
  useDeletePlayer,
  playerPhotoUrl,
  type Player,
} from "@/modules/players/hooks/usePlayers";
import { useAllActiveSanctions, activeSanctionsByPlayer, sanctionMatchesRemaining, type Sanction } from "@/modules/sanctions/hooks/useSanctions";
import { useTeams } from "@/modules/teams/hooks/useTeams";
import { ApiError } from "@/lib/errors";
import { formatCalendarDate } from "@/lib/utils/date";
import { onlyDigits, withSanitizer } from "@/lib/utils/forms";
import { LEAGUE_CATEGORIES, type LeagueCategoryValue } from "@/lib/constants/league-categories";
import { Card } from "@/components/ui/card";
import { Table, Thead, Th, Tbody, Td, EmptyRow } from "@/components/ui/table";
import { Pagination, DEFAULT_PAGE_SIZE, type PageSize } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PhotoInput } from "@/components/ui/photo-input";
import { Modal } from "@/components/ui/modal";
import { PlayerPhotoModal, type PlayerPhotoModalTarget } from "@/components/ui/player-photo-modal";
import { EmptyOptionsHint } from "@/components/ui/empty-options-hint";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { EditPlayerModal } from "@/components/players/EditPlayerModal";

const createPlayerFormSchema = z.object({
  teamId: z.string().uuid("Selecciona un equipo"),
  name: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  folioNumber: z.string().regex(/^\d{1,26}$/, "Ingresa solo dígitos (máximo 26)"),
  birthDate: z.string().optional().or(z.literal("")),
  photo: z.string().optional(),
});
type CreatePlayerForm = z.infer<typeof createPlayerFormSchema>;

function SuspendedPlayerBadge({ sanctions }: { sanctions: Sanction[] }) {
  const sanction = sanctions[0];
  const applied = sanction._count.appliedMatches;
  return (
    <Badge tone="cancelled">
      {sanctions.length === 1
        ? `No puede jugar · ${applied}/${sanction.matchesSuspended} partidos cumplidos (faltan ${sanctionMatchesRemaining(sanction)})`
        : `No puede jugar · ${sanctions.length} sanciones activas`}
    </Badge>
  );
}

export function PlayersTable() {

  const [categoryFilter, setCategoryFilter] = useState<LeagueCategoryValue | "all">(LEAGUE_CATEGORIES[0].value);
  const [teamFilter, setTeamFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [viewingPlayer, setViewingPlayer] = useState<PlayerPhotoModalTarget | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newPlayerCategory, setNewPlayerCategory] = useState<LeagueCategoryValue>(LEAGUE_CATEGORIES[0].value);
  const { confirm, dialog } = useConfirm();

  const { data: teamsData } = useTeams();
  const teams = teamsData?.data ?? [];
  const teamsById = Object.fromEntries(teams.map((t) => [t.id, t.name]));
  const teamsInCategoryFilter = categoryFilter === "all" ? teams : teams.filter((t) => t.category === categoryFilter);
  const teamsInNewPlayerCategory = teams.filter((t) => t.category === newPlayerCategory);

  const isSearching = search.trim().length > 0;
  const { data, isLoading, isError } = usePlayers({
    teamId: teamFilter || undefined,
    category: categoryFilter === "all" ? undefined : categoryFilter,
    page: isSearching ? 1 : page,
    pageSize: isSearching ? 100 : pageSize,
  });
  const createPlayer = useCreatePlayer();
  const { data: activeSanctions } = useAllActiveSanctions();
  const sanctionsByPlayer = activeSanctionsByPlayer(activeSanctions ?? []);

  const handleCategoryChange = (value: LeagueCategoryValue | "all") => {
    setCategoryFilter(value);
    setTeamFilter("");
    setPage(1);
  };
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
    setValue,
    formState: { errors },
  } = useForm<CreatePlayerForm>({ resolver: zodResolver(createPlayerFormSchema) });

  const handleNewPlayerCategoryChange = (category: LeagueCategoryValue) => {
    setNewPlayerCategory(category);
    setValue("teamId", "");
  };
  const selectedTeamId = useWatch({ control, name: "teamId" });
  const selectedTeam = teamsInNewPlayerCategory.find((t) => t.id === selectedTeamId);

  const onSubmit = handleSubmit((values) => {
    createPlayer.mutate(
      {
        teamId: values.teamId,
        name: values.name,
        folioNumber: values.folioNumber,
        birthDate: values.birthDate || undefined,
        photo: values.photo,
      },
      {
        onSuccess: (response) => {
          toast.success(`Jugador "${values.name}" creado con folio ${response.data.registrationNumber}`);
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
          <Field label="Categoría">
            <Select
              value={categoryFilter}
              onChange={(e) => handleCategoryChange(e.target.value as LeagueCategoryValue | "all")}
            >
              {LEAGUE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
              <option value="all">Todas las categorías</option>
            </Select>
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
              {teamsInCategoryFilter.map((team) => (
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
          <Field label="Categoría">
            <Select
              value={newPlayerCategory}
              onChange={(e) => handleNewPlayerCategoryChange(e.target.value as LeagueCategoryValue)}
            >
              {LEAGUE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Equipo" error={errors.teamId?.message}>
            {teamsInNewPlayerCategory.length === 0 ? (
              <EmptyOptionsHint
                message="No hay equipos registrados en esta categoría."
                href="/admin/teams"
                linkLabel="Crea uno primero"
              />
            ) : (
              <Select {...register("teamId")}>
                <option value="">Selecciona...</option>
                {teamsInNewPlayerCategory.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Nombre" error={errors.name?.message}>
            <Input placeholder="Carlos Ramírez" maxLength={100} {...register("name")} />
          </Field>
          <Field label="Folio" error={errors.folioNumber?.message} hint={selectedTeam && !selectedTeam.folioPrefix ? "Asigna un prefijo al equipo antes de registrar jugadores." : undefined}>
            <div className="flex items-center gap-2">
              <span className="min-w-12 font-semibold text-ink">{selectedTeam?.folioPrefix ?? "---"}-</span>
              <Input
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={26}
                placeholder="001"
                aria-label="Dígitos del folio"
                disabled={!selectedTeam?.folioPrefix}
                {...withSanitizer(register("folioNumber"), onlyDigits)}
              />
            </div>
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
            <Button type="submit" disabled={createPlayer.isPending || (!!selectedTeam && !selectedTeam.folioPrefix)}>
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
                  <button
                    type="button"
                    onClick={() => setViewingPlayer({ name: player.name, photoUrl: playerPhotoUrl(player) })}
                    className="flex items-center gap-3 text-left"
                  >
                    <Avatar src={playerPhotoUrl(player)} name={player.name} />
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-ink hover:text-primary">{player.name}</span>
                      {sanctionsByPlayer.has(player.id) && (
                        <SuspendedPlayerBadge sanctions={sanctionsByPlayer.get(player.id)!} />
                      )}
                    </div>
                  </button>
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
        <Pagination
          meta={data?.meta}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </Card>

      <EditPlayerModal player={editingPlayer} teams={teams} onClose={() => setEditingPlayer(null)} />
      <PlayerPhotoModal player={viewingPlayer} onClose={() => setViewingPlayer(null)} />
      {dialog}
    </div>
  );
}
