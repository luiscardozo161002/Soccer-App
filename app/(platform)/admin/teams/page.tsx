"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useTeams,
  useCreateTeam,
  useUpdateTeam,
  useDeleteTeam,
  teamPhotoUrl,
  TEAMS_PAGE_SIZE,
  type Team,
} from "@/hooks/useTeams";
import { ApiError } from "@/lib/errors";
import { LEAGUE_CATEGORIES, type LeagueCategoryValue } from "@/lib/constants/league-categories";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
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
import { EditFormFooter } from "@/components/ui/edit-form-footer";

const categoryValues = LEAGUE_CATEGORIES.map((c) => c.value) as [
  LeagueCategoryValue,
  ...LeagueCategoryValue[],
];

const teamSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  category: z.enum(categoryValues),
  photo: z.string().optional(),
});
type TeamForm = z.infer<typeof teamSchema>;

function EditTeamModal({ team, onClose }: { team: Team | null; onClose: () => void }) {
  const updateTeam = useUpdateTeam();
  const [isEditing, setIsEditing] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<TeamForm>({ resolver: zodResolver(teamSchema) });

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
          <Input disabled={!isEditing} {...register("name")} />
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

export default function TeamsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Equipos</h1>
          <p className="text-sm text-muted">{data?.meta.totalItems ?? 0} equipo(s) registrado(s).</p>
        </div>
        <div className="w-56">
          <Field label="Buscar">
            <Input placeholder="Nombre del equipo..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </Field>
        </div>
      </div>

      <Card>
        <CardHeader title="Nuevo equipo" />
        <CardBody>
          <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-4">
            <div className="w-56">
              <Field label="Nombre" error={errors.name?.message}>
                <Input placeholder="Tigres FC" {...register("name")} />
              </Field>
            </div>
            <div className="w-48">
              <Field label="Categoría" error={errors.category?.message}>
                <Select {...register("category")}>
                  {LEAGUE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Controller
              control={control}
              name="photo"
              render={({ field }) => (
                <PhotoInput value={field.value} onChange={field.onChange} uploading={createTeam.isPending} />
              )}
            />
            <Button type="submit" disabled={createTeam.isPending}>
              {createTeam.isPending ? "Creando..." : "Crear equipo"}
            </Button>
          </form>
        </CardBody>
      </Card>

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
