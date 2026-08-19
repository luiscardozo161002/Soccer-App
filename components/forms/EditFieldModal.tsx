"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useUpdateField, type Field as FieldType } from "@/hooks/useFields";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { ApiError } from "@/lib/errors";
import { Field as FormField, Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { EditFormFooter } from "@/components/ui/edit-form-footer";

export const fieldSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  location: z.string().trim().max(200).optional().or(z.literal("")),
});
export type FieldForm = z.infer<typeof fieldSchema>;

export function EditFieldModal({ field, onClose }: { field: FieldType | null; onClose: () => void }) {
  const updateField = useUpdateField();
  const [isEditing, setIsEditing] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FieldForm>({ resolver: zodResolver(fieldSchema) });

  useUnsavedChangesWarning(isEditing && isDirty);

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
          <Input maxLength={100} disabled={!isEditing} {...register("name")} />
        </FormField>
        <FormField label="Ubicación (opcional)" error={errors.location?.message}>
          <Input
            maxLength={200}
            disabled={!isEditing}
            placeholder="20.036978, -99.326613"
            {...register("location")}
          />
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
