"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useTeams, useCreateTeam, useDeleteTeam, teamPhotoUrl, TEAMS_PAGE_SIZE, type Team } from "@/hooks/useTeams";
import { ApiError } from "@/lib/errors";
import { LEAGUE_CATEGORIES } from "@/lib/constants/league-categories";
import { Card } from "@/components/ui/card";
import { Table, Thead, Th, Tbody, Td, EmptyRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { CategoryBadge } from "@/components/ui/category-badge";
import { Avatar } from "@/components/ui/avatar";
import { PhotoInput } from "@/components/ui/photo-input";
import { Modal } from "@/components/ui/modal";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { EditTeamModal, teamSchema, type TeamForm } from "@/components/forms/EditTeamModal";

export default function TeamsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const { confirm, dialog } = useConfirm();

  const isSearching = search.trim().length > 0;
  const { data, isLoading, isError } = useTeams(isSearching ? 1 : page, isSearching ? 100 : TEAMS_PAGE_SIZE);
  const createTeam = useCreateTeam();
  const deleteTeam = useDeleteTeam();
  const term = search.trim().toLowerCase();
  const teams = (data?.data ?? []).filter((t) => !term || t.name.toLowerCase().includes(term));

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeamForm>({
    resolver: zodResolver(teamSchema),
    defaultValues: { category: "primera_division" },
  });

  const onSubmit = handleSubmit((values) => {
    createTeam.mutate(
      { name: values.name, category: values.category, photo: values.photo },
      {
        onSuccess: () => {
          toast.success(`Equipo "${values.name}" creado`);
          reset();
          setShowCreate(false);
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "No se pudo crear el equipo"),
      }
    );
  });

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: `¿Eliminar el equipo "${name}"?`,
      description: "Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
    });
    if (!ok) return;
    deleteTeam.mutate(id, {
      onSuccess: () => toast.success("Equipo eliminado"),
      onError: (error) =>
        toast.error(error instanceof ApiError ? error.message : "No se pudo eliminar el equipo"),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink">Equipos</h1>
          <p className="text-sm text-muted">{data?.meta.totalItems ?? 0} equipo(s) registrado(s).</p>
        </div>
        <div className="w-56">
          <Field label="Buscar">
            <Input placeholder="Nombre del equipo..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </Field>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          Nuevo equipo
        </Button>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo equipo">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label="Nombre" error={errors.name?.message}>
            <Input placeholder="Tigres FC" maxLength={100} {...register("name")} />
          </Field>
          <Field label="Categoría" error={errors.category?.message}>
            <Select {...register("category")}>
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
              <PhotoInput value={field.value} onChange={field.onChange} uploading={createTeam.isPending} />
            )}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={createTeam.isPending}>
              {createTeam.isPending ? "Creando..." : "Crear equipo"}
            </Button>
          </div>
        </form>
      </Modal>

      <Card>
        <Table>
          <Thead>
            <Th>Equipo</Th>
            <Th>Categoría</Th>
            <Th>Registrado</Th>
            <Th>Estatus</Th>
            <Th className="text-right">Acciones</Th>
          </Thead>
          <Tbody>
            {isLoading && <EmptyRow colSpan={5} message="Cargando..." />}
            {isError && <EmptyRow colSpan={5} message="No se pudo cargar la lista de equipos." />}
            {!isLoading && !isError && teams.length === 0 && (
              <EmptyRow colSpan={5} message="Todavía no hay equipos registrados." />
            )}
            {teams.map((team) => (
              <tr key={team.id}>
                <Td>
                  <div className="flex items-center gap-3 object-cover">
                    <Avatar src={teamPhotoUrl(team)} name={team.name} />
                    <span className="font-semibold text-ink">{team.name}</span>
                  </div>
                </Td>
                <Td>
                  <CategoryBadge category={team.category} />
                </Td>
                <Td>{new Date(team.registeredAt).toLocaleDateString("es-MX")}</Td>
                <Td>
                  <Badge tone={team.status}>{team.status === "active" ? "Activo" : "Inactivo"}</Badge>
                </Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar ${team.name}`}
                      onClick={() => setEditingTeam(team)}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Eliminar ${team.name}`}
                      onClick={() => handleDelete(team.id, team.name)}
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

      <EditTeamModal team={editingTeam} onClose={() => setEditingTeam(null)} />
      {dialog}
    </div>
  );
}
