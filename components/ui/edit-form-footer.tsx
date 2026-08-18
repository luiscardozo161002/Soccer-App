"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

// Shared footer for every "Editar X" modal: "Editar" enables the fields and
// swaps in Cancelar/Guardar; Guardar stays disabled until something changed.
export function EditFormFooter({
  isEditing,
  isDirty,
  submitting,
  onEdit,
  onCancel,
  submitLabel = "Guardar cambios",
}: {
  isEditing: boolean;
  isDirty: boolean;
  submitting: boolean;
  onEdit: () => void;
  onCancel: () => void;
  submitLabel?: string;
}) {
  if (!isEditing) {
    return (
      <div className="flex justify-end">
        <Button type="button" onClick={onEdit}>
          <Pencil size={15} />
          Editar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex justify-end gap-2">
      <Button type="button" variant="ghost" onClick={onCancel}>
        Cancelar
      </Button>
      <Button type="submit" disabled={!isDirty || submitting}>
        {submitting ? "Guardando..." : submitLabel}
      </Button>
    </div>
  );
}
