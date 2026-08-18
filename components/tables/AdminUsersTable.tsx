"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, UserPlus, UserCheck, UserX } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, adminPhotoUrl, type AdminUser } from "@/hooks/useUsers";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { ApiError } from "@/lib/errors";
import { withSanitizer, sanitizePhone } from "@/lib/utils/forms";
import { passwordSchema } from "@/lib/validation/password";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Table, Thead, Th, Tbody, Td, EmptyRow } from "@/components/ui/table";
import { Pagination, DEFAULT_PAGE_SIZE, type PageSize } from "@/components/ui/pagination";
import { Field, Input } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PhotoInput } from "@/components/ui/photo-input";
import { Avatar } from "@/components/ui/avatar";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { ActionsMenu } from "@/components/ui/actions-menu";
import { EditUserModal } from "@/components/forms/EditUserModal";

const createUserSchema = z.object({
  username: z.string().trim().min(3, "Mínimo 3 caracteres").max(40),
  email: z.string().trim().email("Correo inválido"),
  phoneNumber: z.string().trim().max(20).optional().or(z.literal("")),
  password: passwordSchema,
  photo: z.string().optional(),
});
type CreateUserForm = z.infer<typeof createUserSchema>;

export function AdminUsersTable({ currentUserId }: { currentUserId: string }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);
  const { data, isLoading, isError } = useUsers(page, pageSize);
  const users = data?.data ?? [];
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const { confirm, dialog } = useConfirm();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CreateUserForm>({ resolver: zodResolver(createUserSchema) });

  useUnsavedChangesWarning(isDirty);

  const onSubmit = handleSubmit((values) => {
    createUser.mutate(
      { ...values, role: "admin" },
      {
        onSuccess: () => {
          toast.success(`Administrador "${values.username}" creado`);
          reset();
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "No se pudo crear el administrador"),
      }
    );
  });

  const handleDelete = async (user: AdminUser) => {
    const ok = await confirm({
      title: `¿Eliminar a "${user.username}"?`,
      description: "Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
    });
    if (!ok) return;
    deleteUser.mutate(user.id, {
      onSuccess: () => toast.success("Administrador eliminado"),
      onError: (error) =>
        toast.error(error instanceof ApiError ? error.message : "No se pudo eliminar el administrador"),
    });
  };

  const handleToggleStatus = async (user: AdminUser) => {
    const activating = user.status === "inactive";
    const ok = await confirm({
      title: activating ? `¿Activar a "${user.username}"?` : `¿Desactivar a "${user.username}"?`,
      description: activating
        ? "Podrá volver a iniciar sesión en el portal de gestión."
        : "No podrá iniciar sesión en el portal de gestión hasta que se reactive.",
      confirmLabel: activating ? "Activar" : "Desactivar",
      tone: activating ? "primary" : "danger",
    });
    if (!ok) return;
    updateUser.mutate(
      { id: user.id, status: activating ? "active" : "inactive" },
      {
        onSuccess: () => toast.success(activating ? "Administrador activado" : "Administrador desactivado"),
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "No se pudo actualizar el estatus"),
      }
    );
  };

  return (
    <Card>
      <CardHeader title="Administradores" description="Quién tiene acceso al portal de gestión." />
      <CardBody>
        <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-4">
          <div className="w-40">
            <Field label="Usuario" error={errors.username?.message}>
              <Input placeholder="usuario" maxLength={40} {...register("username")} />
            </Field>
          </div>
          <div className="w-56">
            <Field label="Correo" error={errors.email?.message}>
              <Input type="email" placeholder="correo@ejemplo.com" {...register("email")} />
            </Field>
          </div>
          <div className="w-40">
            <Field label="Teléfono (opcional)" error={errors.phoneNumber?.message}>
              <Input
                type="tel"
                inputMode="tel"
                maxLength={20}
                {...withSanitizer(register("phoneNumber"), sanitizePhone)}
              />
            </Field>
          </div>
          <div className="w-44">
            <Field label="Contraseña" error={errors.password?.message}>
              <PasswordInput {...register("password")} />
            </Field>
          </div>
          <Controller
            control={control}
            name="photo"
            render={({ field }) => (
              <PhotoInput value={field.value} onChange={field.onChange} uploading={createUser.isPending} />
            )}
          />
          <Button type="submit" disabled={createUser.isPending}>
            <UserPlus size={16} />
            {createUser.isPending ? "Creando..." : "Crear administrador"}
          </Button>
        </form>
      </CardBody>

      <Table>
        <Thead>
          <Th>Usuario</Th>
          <Th>Correo</Th>
          <Th>Estatus</Th>
          <Th className="text-right">Acciones</Th>
        </Thead>
        <Tbody>
          {isLoading && <EmptyRow colSpan={4} message="Cargando..." />}
          {isError && <EmptyRow colSpan={4} message="No se pudo cargar la lista de administradores." />}
          {users.map((user) => (
            <tr key={user.id}>
              <Td className="font-semibold text-ink">
                <div className="flex items-center gap-2.5">
                  <Avatar src={adminPhotoUrl(user)} name={user.username} size={26} />
                  {user.username}
                  {user.id === currentUserId && (
                    <span className="text-xs font-normal text-muted">(tú)</span>
                  )}
                </div>
              </Td>
              <Td>{user.email}</Td>
              <Td>
                <Badge tone={user.status}>{user.status === "active" ? "Activo" : "Inactivo"}</Badge>
              </Td>
              <Td className="text-right">
                <div className="flex justify-end">
                  <ActionsMenu
                    label={`Acciones para ${user.username}`}
                    items={[
                      { label: "Editar", icon: <Pencil size={15} />, onClick: () => setEditingUser(user) },
                      user.status === "active"
                        ? { label: "Desactivar", icon: <UserX size={15} />, onClick: () => handleToggleStatus(user) }
                        : { label: "Activar", icon: <UserCheck size={15} />, onClick: () => handleToggleStatus(user) },
                      {
                        label: "Eliminar",
                        icon: <Trash2 size={15} />,
                        tone: "danger",
                        disabled: user.id === currentUserId,
                        onClick: () => handleDelete(user),
                      },
                    ]}
                  />
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

      <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />
      {dialog}
    </Card>
  );
}
