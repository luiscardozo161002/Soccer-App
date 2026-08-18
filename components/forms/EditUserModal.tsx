"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useUpdateUser, adminPhotoUrl, type AdminUser } from "@/hooks/useUsers";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { ApiError } from "@/lib/errors";
import { withSanitizer, sanitizePhone } from "@/lib/utils/forms";
import { Field, Input } from "@/components/ui/field";
import { PhotoInput } from "@/components/ui/photo-input";
import { Modal } from "@/components/ui/modal";
import { EditFormFooter } from "@/components/ui/edit-form-footer";

export const editUserSchema = z.object({
  username: z.string().trim().min(3, "Mínimo 3 caracteres").max(40),
  email: z.string().trim().email("Correo inválido"),
  phoneNumber: z.string().trim().max(20).optional().or(z.literal("")),
  photo: z.string().optional(),
});
export type EditUserForm = z.infer<typeof editUserSchema>;

export function EditUserModal({ user, onClose }: { user: AdminUser | null; onClose: () => void }) {
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

  useUnsavedChangesWarning(isEditing && (isDirty || photoRemoved));

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
