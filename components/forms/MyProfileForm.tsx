"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useUsers, useUpdateUser, adminPhotoUrl } from "@/hooks/useUsers";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { ApiError } from "@/lib/errors";
import { withSanitizer, sanitizePhone } from "@/lib/utils/forms";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { PhotoInput } from "@/components/ui/photo-input";
import { EditFormFooter } from "@/components/ui/edit-form-footer";

const profileSchema = z.object({
  username: z.string().trim().min(3, "Mínimo 3 caracteres").max(40),
  email: z.string().trim().email("Correo inválido"),
  phoneNumber: z.string().trim().max(20).optional().or(z.literal("")),
  photo: z.string().optional(),
});
type ProfileForm = z.infer<typeof profileSchema>;

export function MyProfileForm({ userId }: { userId: string }) {
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

  useUnsavedChangesWarning(isEditing && (isDirty || photoRemoved));

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
