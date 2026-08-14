"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

// Shared footer for every "Editar X" modal: fields start disabled and the
// only control is "Editar"; clicking it enables the fields and swaps in
// Cancelar/Guardar, with Guardar staying disabled until something actually
// changed (isDirty), so there's nothing to save on a no-op edit.
export function EditFormFooter({
  isEditing,
  isDirty,
  submitting,
  onEdit,
  onCancel,
}: {
  isEditing: boolean;
  isDirty: boolean;
  submitting: boolean;
  onEdit: () => void;
  onCancel: () => void;
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
        {submitting ? "Guardando..." : "Guardar cambios"}
      </Button>
    </div>
  );
}
