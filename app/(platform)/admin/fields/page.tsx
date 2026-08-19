"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2, MapPinned, Pencil, ExternalLink, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  useFields,
  useCreateField,
  useDeleteField,
  googleMapsUrl,
  type Field as FieldType,
} from "@/hooks/useFields";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { ApiError } from "@/lib/errors";
import { Card } from "@/components/ui/card";
import { Table, Thead, Th, Tbody, Td, EmptyRow } from "@/components/ui/table";
import { Pagination, DEFAULT_PAGE_SIZE, type PageSize } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Field as FormField, Input } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { EditFieldModal, fieldSchema, type FieldForm } from "@/components/forms/EditFieldModal";

export default function FieldsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [editingField, setEditingField] = useState<FieldType | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const { confirm, dialog } = useConfirm();

  const isSearching = search.trim().length > 0;
  const { data, isLoading, isError } = useFields(isSearching ? 1 : page, isSearching ? 100 : pageSize);
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
    formState: { errors, isDirty },
  } = useForm<FieldForm>({ resolver: zodResolver(fieldSchema) });

  useUnsavedChangesWarning(showCreate && isDirty);

  const onSubmit = handleSubmit((values) => {
    createField.mutate(
      { name: values.name, location: values.location || undefined },
      {
        onSuccess: () => {
          toast.success(`Cancha "${values.name}" creada`);
          reset();
          setShowCreate(false);
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink">Canchas</h1>
          <p className="text-sm text-muted">{data?.meta.totalItems ?? 0} cancha(s) registrada(s).</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-56">
            <FormField label="Buscar">
              <Input placeholder="Nombre o ubicación..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </FormField>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            Nueva cancha
          </Button>
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva cancha">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormField label="Nombre" error={errors.name?.message}>
            <Input placeholder="Cancha Municipal 1" maxLength={100} {...register("name")} />
          </FormField>
          <FormField label="Ubicación (opcional)" error={errors.location?.message}>
            <Input placeholder="20.036978, -99.326613" maxLength={200} {...register("location")} />
          </FormField>
          <p className="text-xs text-muted">
            Tip: lo más preciso es pegar las coordenadas (en Google Maps: clic derecho en el punto exacto,
            o &ldquo;Compartir esta ubicación&rdquo;, y copia el par de números). También acepta una
            dirección de texto o un enlace de Maps — pero el nombre del lugar puede repetirse en varios
            sitios, así que las coordenadas son las únicas que no fallan.
          </p>
          <div className="flex justify-end">
            <Button type="submit" disabled={createField.isPending}>
              {createField.isPending ? "Creando..." : "Crear cancha"}
            </Button>
          </div>
        </form>
      </Modal>

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
        <Pagination
          meta={data?.meta}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </Card>

      <EditFieldModal field={editingField} onClose={() => setEditingField(null)} />
      {dialog}
    </div>
  );
}
