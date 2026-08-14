"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2, MapPinned, Pencil, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  useFields,
  useCreateField,
  useUpdateField,
  useDeleteField,
  googleMapsUrl,
  FIELDS_PAGE_SIZE,
  type Field as FieldType,
} from "@/hooks/useFields";
import { ApiError } from "@/lib/errors";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Table, Thead, Th, Tbody, Td, EmptyRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Field as FormField, Input } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { EditFormFooter } from "@/components/ui/edit-form-footer";

const fieldSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  location: z.string().trim().max(200).optional().or(z.literal("")),
});
type FieldForm = z.infer<typeof fieldSchema>;

function EditFieldModal({ field, onClose }: { field: FieldType | null; onClose: () => void }) {
  const updateField = useUpdateField();
  const [isEditing, setIsEditing] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FieldForm>({ resolver: zodResolver(fieldSchema) });

  useEffect(() => {
    if (field) {
      reset({ name: field.name, location: field.location ?? "" });
      setIsEditing(false);
    }
  }, [field, reset]);

  if (!field) return null;

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  const handleCancel = () => {
    reset({ name: field.name, location: field.location ?? "" });
    setIsEditing(false);
  };

  const onSubmit = handleSubmit((values) => {
    updateField.mutate(
      { id: field.id, name: values.name, location: values.location || undefined },
      {
        onSuccess: () => {
          toast.success("Cancha actualizada");
          handleClose();
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "No se pudo actualizar la cancha"),
      }
    );
  });

  return (
    <Modal open={!!field} onClose={handleClose} title="Editar cancha">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <FormField label="Nombre" error={errors.name?.message}>
          <Input disabled={!isEditing} {...register("name")} />
        </FormField>
        <FormField label="Ubicación (opcional)" error={errors.location?.message}>
          <Input disabled={!isEditing} placeholder="Av. Reforma 123" {...register("location")} />
        </FormField>
        <EditFormFooter
          isEditing={isEditing}
          isDirty={isDirty}
          submitting={updateField.isPending}
          onEdit={() => setIsEditing(true)}
          onCancel={handleCancel}
        />
      </form>
    </Modal>
  );
}

export default function FieldsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editingField, setEditingField] = useState<FieldType | null>(null);
  const { confirm, dialog } = useConfirm();

  const isSearching = search.trim().length > 0;
  const { data, isLoading, isError } = useFields(isSearching ? 1 : page, isSearching ? 100 : FIELDS_PAGE_SIZE);
  const createField = useCreateField();
  const deleteField = useDeleteField();
  const term = search.trim().toLowerCase();
  const fields = (data?.data ?? []).filter(
    (f) => !term || f.name.toLowerCase().includes(term) || (f.location ?? "").toLowerCase().includes(term)
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FieldForm>({ resolver: zodResolver(fieldSchema) });

  const onSubmit = handleSubmit((values) => {
    createField.mutate(
      { name: values.name, location: values.location || undefined },
      {
        onSuccess: () => {
          toast.success(`Cancha "${values.name}" creada`);
          reset();
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "No se pudo crear la cancha"),
      }
    );
  });

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: `¿Eliminar la cancha "${name}"?`,
      description: "Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
    });
    if (!ok) return;
    deleteField.mutate(id, {
      onSuccess: () => toast.success("Cancha eliminada"),
      onError: (error) =>
        toast.error(error instanceof ApiError ? error.message : "No se pudo eliminar la cancha"),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Canchas</h1>
          <p className="text-sm text-muted">{data?.meta.totalItems ?? 0} cancha(s) registrada(s).</p>
        </div>
        <div className="w-56">
          <FormField label="Buscar">
            <Input placeholder="Nombre o ubicación..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </FormField>
        </div>
      </div>

      <Card>
        <CardHeader title="Nueva cancha" />
        <CardBody>
          <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-4">
            <div className="w-56">
              <FormField label="Nombre" error={errors.name?.message}>
                <Input placeholder="Cancha Municipal 1" {...register("name")} />
              </FormField>
            </div>
            <div className="w-64">
              <FormField label="Ubicación (opcional)" error={errors.location?.message}>
                <Input placeholder="Av. Reforma 123" {...register("location")} />
              </FormField>
            </div>
            <Button type="submit" disabled={createField.isPending}>
              {createField.isPending ? "Creando..." : "Crear cancha"}
            </Button>
          </form>
          <p className="mt-3 text-xs text-muted">
            Tip: escribe la dirección tal como la buscarías en Google Maps — cada cancha tendrá un enlace
            directo para verla en el mapa.
          </p>
        </CardBody>
      </Card>

      <Card>
        <Table>
          <Thead>
            <Th>Cancha</Th>
            <Th>Ubicación</Th>
            <Th>Estatus</Th>
            <Th className="text-right">Acciones</Th>
          </Thead>
          <Tbody>
            {isLoading && <EmptyRow colSpan={4} message="Cargando..." />}
            {isError && <EmptyRow colSpan={4} message="No se pudo cargar la lista de canchas." />}
            {!isLoading && !isError && fields.length === 0 && (
              <EmptyRow colSpan={4} message="Todavía no hay canchas registradas." />
            )}
            {fields.map((field) => (
              <tr key={field.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                      <MapPinned size={16} />
                    </span>
                    <span className="font-semibold text-ink">{field.name}</span>
                  </div>
                </Td>
                <Td>
                  {field.location ? (
                    <a
                      href={googleMapsUrl(field.location)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      {field.location}
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    "—"
                  )}
                </Td>
                <Td>
                  <Badge tone={field.status}>{field.status === "active" ? "Activa" : "Inactiva"}</Badge>
                </Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar ${field.name}`}
                      onClick={() => setEditingField(field)}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Eliminar ${field.name}`}
                      onClick={() => handleDelete(field.id, field.name)}
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

      <EditFieldModal field={editingField} onClose={() => setEditingField(null)} />
      {dialog}
    </div>
  );
}
