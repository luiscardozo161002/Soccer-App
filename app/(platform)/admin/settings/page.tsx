"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { History, RotateCcw, Pencil, Trash2, UserPlus, UserCheck, UserX } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSettings, useUpdateSettings, siteLogoUrl } from "@/hooks/useSettings";
import { useResetTournament } from "@/hooks/useTournament";
import { useMe } from "@/hooks/useAuth";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, adminPhotoUrl, type AdminUser } from "@/hooks/useUsers";
import { ApiError } from "@/lib/errors";
import { withSanitizer, sanitizePhone, onlyHexColor } from "@/lib/forms";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Table, Thead, Th, Tbody, Td, EmptyRow } from "@/components/ui/table";
import { Field, Input } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PhotoInput } from "@/components/ui/photo-input";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { EditFormFooter } from "@/components/ui/edit-form-footer";
import { ActionsMenu } from "@/components/ui/actions-menu";

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 shrink-0 cursor-pointer rounded-lg border border-border bg-surface p-1"
        />
        <Input
          value={value}
          onChange={(e) => onChange(onlyHexColor(e.target.value))}
          maxLength={7}
          className="uppercase"
        />
      </div>
    </Field>
  );
}

const profileSchema = z.object({
  username: z.string().trim().min(3, "Mínimo 3 caracteres").max(40),
  email: z.string().trim().email("Correo inválido"),
  phoneNumber: z.string().trim().max(20).optional().or(z.literal("")),
  photo: z.string().optional(),
});
type ProfileForm = z.infer<typeof profileSchema>;

function MyProfileCard({ userId }: { userId: string }) {
  const { data, isLoading } = useUsers();
  const me = data?.data.find((u) => u.id === userId);
  const updateUser = useUpdateUser();
  const [isEditing, setIsEditing] = useState(false);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });

  const originalValues = me
    ? { username: me.username, email: me.email, phoneNumber: me.phoneNumber ?? "", photo: undefined }
    : null;

  useEffect(() => {
    if (originalValues) {
      reset(originalValues);
      setIsEditing(false);
      setPhotoRemoved(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, reset]);

  if (isLoading || !me || !originalValues) return null;

  const handleCancel = () => {
    reset(originalValues);
    setIsEditing(false);
    setPhotoRemoved(false);
  };

  const onSubmit = handleSubmit((values) => {
    updateUser.mutate(
      {
        id: userId,
        username: values.username,
        email: values.email,
        phoneNumber: values.phoneNumber,
        photo: photoRemoved ? null : values.photo,
      },
      {
        onSuccess: () => {
          toast.success("Perfil actualizado");
          setIsEditing(false);
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "No se pudo actualizar el perfil"),
      }
    );
  });

  return (
    <Card>
      <CardHeader title="Mi perfil" description="Tu usuario y datos de contacto." />
      <CardBody>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-48">
              <Field label="Usuario" error={errors.username?.message}>
                <Input maxLength={40} disabled={!isEditing} {...register("username")} />
              </Field>
            </div>
            <div className="w-64">
              <Field label="Correo" error={errors.email?.message}>
                <Input type="email" disabled={!isEditing} {...register("email")} />
              </Field>
            </div>
            <div className="w-44">
              <Field label="Teléfono (opcional)" error={errors.phoneNumber?.message}>
                <Input
                  type="tel"
                  inputMode="tel"
                  maxLength={20}
                  disabled={!isEditing}
                  {...withSanitizer(register("phoneNumber"), sanitizePhone)}
                />
              </Field>
            </div>
            <Controller
              control={control}
              name="photo"
              render={({ field }) => (
                <PhotoInput
                  label="Foto (opcional)"
                  value={photoRemoved ? undefined : field.value ?? adminPhotoUrl(me) ?? undefined}
                  onChange={(dataUrl) => {
                    field.onChange(dataUrl);
                    setPhotoRemoved(false);
                  }}
                  onRemove={() => {
                    field.onChange(undefined);
                    setPhotoRemoved(true);
                  }}
                  disabled={!isEditing}
                  uploading={updateUser.isPending}
                />
              )}
            />
          </div>
          <EditFormFooter
            isEditing={isEditing}
            isDirty={isDirty || photoRemoved}
            submitting={updateUser.isPending}
            onEdit={() => setIsEditing(true)}
            onCancel={handleCancel}
            submitLabel="Guardar perfil"
          />
        </form>
        <p className="mt-3 text-xs text-muted">
          Para cambiar tu contraseña, cierra sesión y usa &ldquo;¿Olvidaste tu contraseña?&rdquo; en la pantalla de acceso.
        </p>
      </CardBody>
    </Card>
  );
}

const createUserSchema = z.object({
  username: z.string().trim().min(3, "Mínimo 3 caracteres").max(40),
  email: z.string().trim().email("Correo inválido"),
  phoneNumber: z.string().trim().max(20).optional().or(z.literal("")),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  photo: z.string().optional(),
});
type CreateUserForm = z.infer<typeof createUserSchema>;

const editUserSchema = z.object({
  username: z.string().trim().min(3, "Mínimo 3 caracteres").max(40),
  email: z.string().trim().email("Correo inválido"),
  phoneNumber: z.string().trim().max(20).optional().or(z.literal("")),
  photo: z.string().optional(),
});
type EditUserForm = z.infer<typeof editUserSchema>;

function EditUserModal({ user, onClose }: { user: AdminUser | null; onClose: () => void }) {
  const updateUser = useUpdateUser();
  const [isEditing, setIsEditing] = useState(false);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditUserForm>({ resolver: zodResolver(editUserSchema) });

  useEffect(() => {
    if (user) {
      reset({ username: user.username, email: user.email, phoneNumber: user.phoneNumber ?? "", photo: undefined });
      setIsEditing(false);
      setPhotoRemoved(false);
    }
  }, [user, reset]);

  if (!user) return null;

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  const handleCancel = () => {
    reset({ username: user.username, email: user.email, phoneNumber: user.phoneNumber ?? "", photo: undefined });
    setIsEditing(false);
    setPhotoRemoved(false);
  };

  const onSubmit = handleSubmit((values) => {
    updateUser.mutate(
      { id: user.id, ...values, photo: photoRemoved ? null : values.photo },
      {
        onSuccess: () => {
          toast.success("Administrador actualizado");
          handleClose();
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "No se pudo actualizar el administrador"),
      }
    );
  });

  return (
    <Modal open={!!user} onClose={handleClose} title="Editar administrador">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Usuario" error={errors.username?.message}>
          <Input maxLength={40} disabled={!isEditing} {...register("username")} />
        </Field>
        <Field label="Correo" error={errors.email?.message}>
          <Input type="email" disabled={!isEditing} {...register("email")} />
        </Field>
        <Field label="Teléfono (opcional)" error={errors.phoneNumber?.message}>
          <Input
            type="tel"
            inputMode="tel"
            maxLength={20}
            disabled={!isEditing}
            {...withSanitizer(register("phoneNumber"), sanitizePhone)}
          />
        </Field>
        <Controller
          control={control}
          name="photo"
          render={({ field }) => (
            <PhotoInput
              value={photoRemoved ? undefined : field.value ?? adminPhotoUrl(user) ?? undefined}
              onChange={(dataUrl) => {
                field.onChange(dataUrl);
                setPhotoRemoved(false);
              }}
              onRemove={() => {
                field.onChange(undefined);
                setPhotoRemoved(true);
              }}
              disabled={!isEditing}
              uploading={updateUser.isPending}
            />
          )}
        />
        <EditFormFooter
          isEditing={isEditing}
          isDirty={isDirty || photoRemoved}
          submitting={updateUser.isPending}
          onEdit={() => setIsEditing(true)}
          onCancel={handleCancel}
        />
      </form>
    </Modal>
  );
}

function AdminUsersCard({ currentUserId }: { currentUserId: string }) {
  const { data, isLoading, isError } = useUsers();
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
    formState: { errors },
  } = useForm<CreateUserForm>({ resolver: zodResolver(createUserSchema) });

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

      <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />
      {dialog}
    </Card>
  );
}

export default function SettingsPage() {
  const { data, isLoading } = useSettings();
  const settings = data?.data;
  const updateSettings = useUpdateSettings();
  const resetTournament = useResetTournament();
  const { confirm, dialog } = useConfirm();
  const { data: meData } = useMe();
  const me = meData?.data;

  const [name, setName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#0d9488");
  const [backgroundColor, setBackgroundColor] = useState("#eef3f1");
  const [logo, setLogo] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (settings) {
      setName(settings.name);
      setPrimaryColor(settings.primaryColor);
      setBackgroundColor(settings.backgroundColor);
    }
  }, [settings]);

  const handleSaveBranding = () => {
    updateSettings.mutate(
      { name },
      {
        onSuccess: () => {
          toast.success("Nombre actualizado");
          window.location.reload();
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "No se pudo actualizar el nombre"),
      }
    );
  };

  const handleSaveLogo = () => {
    if (!logo) return;
    updateSettings.mutate(
      { logo },
      {
        onSuccess: () => {
          toast.success("Logo actualizado");
          setLogo(undefined);
          window.location.reload();
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "No se pudo actualizar el logo"),
      }
    );
  };

  const handleSaveColors = () => {
    updateSettings.mutate(
      { primaryColor, backgroundColor },
      {
        onSuccess: () => {
          toast.success("Colores actualizados");
          window.location.reload();
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "No se pudieron actualizar los colores"),
      }
    );
  };

  const handleReset = async () => {
    const ok = await confirm({
      title: "¿Reiniciar el torneo?",
      description:
        "Se archivará la temporada activa (con su tabla final visible en el historial) y se abrirá una nueva vacía. Los equipos, jugadores y canchas se conservan.",
      confirmLabel: "Reiniciar torneo",
      tone: "danger",
    });
    if (!ok) return;
    resetTournament.mutate(undefined, {
      onSuccess: () => toast.success("Torneo reiniciado"),
      onError: (error) =>
        toast.error(error instanceof ApiError ? error.message : "No se pudo reiniciar el torneo"),
    });
  };

  if (isLoading || !settings) {
    return <p className="text-sm text-muted">Cargando...</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-ink">Configuración</h1>
        <p className="text-sm text-muted">Marca, tema y administración del torneo.</p>
      </div>

      <Card>
        <CardHeader title="Nombre del software" description="Se muestra en el menú del admin y en el sitio público." />
        <CardBody>
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-72">
              <Field label="Nombre">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Liga de Futbol"
                  maxLength={80}
                />
              </Field>
            </div>
            <Button onClick={handleSaveBranding} disabled={updateSettings.isPending || !name.trim()}>
              Guardar nombre
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Logo" description="Se usa en el menú del admin y el sitio público." />
        <CardBody>
          <div className="flex flex-wrap items-end gap-4">
            <PhotoInput
              value={logo ?? siteLogoUrl(settings) ?? undefined}
              onChange={setLogo}
              label="Logo"
              uploading={updateSettings.isPending}
            />
            <Button onClick={handleSaveLogo} disabled={updateSettings.isPending || !logo}>
              Guardar logo
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Colores del tema"
          description="Color de botones/acentos y color de fondo del panel de administración."
        />
        <CardBody>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ColorField label="Color de botones (acento)" value={primaryColor} onChange={setPrimaryColor} />
              <ColorField label="Color de fondo" value={backgroundColor} onChange={setBackgroundColor} />
            </div>
            <p className="text-xs text-muted">
              Estos colores aplican al panel de administración y al sitio público.
            </p>
            <div>
              <Button onClick={handleSaveColors} disabled={updateSettings.isPending}>
                Guardar colores
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Torneo" description="Historial y reinicio de temporada." />
        <CardBody>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/admin/history">
              <Button variant="secondary">
                <History size={16} />
                Ver historial de torneos
              </Button>
            </Link>
            <Button variant="danger" onClick={handleReset} disabled={resetTournament.isPending}>
              <RotateCcw size={16} />
              {resetTournament.isPending ? "Reiniciando..." : "Reiniciar torneo"}
            </Button>
          </div>
        </CardBody>
      </Card>

      {me && <MyProfileCard userId={me.id} />}
      {me && <AdminUsersCard currentUserId={me.id} />}

      {dialog}
    </div>
  );
}
