"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trophy, Users, Swords } from "lucide-react";
import { useCups, useCreateCup } from "@/hooks/useCups";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { ApiError } from "@/lib/errors";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";

const createCupSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(100),
});
type CreateCupForm = z.infer<typeof createCupSchema>;

export default function CupListPage() {
  const { data, isLoading, isError } = useCups();
  const cups = data?.data ?? [];
  const createCup = useCreateCup();
  const [showCreate, setShowCreate] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CreateCupForm>({ resolver: zodResolver(createCupSchema) });

  useUnsavedChangesWarning(showCreate && isDirty);

  const onSubmit = handleSubmit((values) => {
    createCup.mutate(values, {
      onSuccess: () => {
        toast.success(`Copa "${values.name}" creada`);
        reset();
        setShowCreate(false);
      },
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "No se pudo crear la copa"),
    });
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink">Copa</h1>
          <p className="text-sm text-muted">Torneos de eliminación directa, aparte de la liga regular.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          Nueva copa
        </Button>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva copa">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label="Nombre" error={errors.name?.message}>
            <Input placeholder="Torneo de Copa 2026" maxLength={100} {...register("name")} />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" disabled={createCup.isPending}>
              {createCup.isPending ? "Creando..." : "Crear copa"}
            </Button>
          </div>
        </form>
      </Modal>

      {isLoading && <p className="text-sm text-muted">Cargando...</p>}
      {isError && <p className="text-sm text-muted">No se pudo cargar la lista de copas.</p>}
      {!isLoading && !isError && cups.length === 0 && (
        <p className="text-sm text-muted">Todavía no hay copas registradas.</p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cups.map((cup) => (
          <Link key={cup.id} href={`/admin/cup/${cup.id}`}>
            <Card className="h-full transition-shadow hover:shadow-[0_20px_45px_-24px_rgba(15,23,42,0.3)]">
              <div className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                    <Trophy size={16} />
                  </span>
                  <Badge tone={cup.status}>{cup.status === "active" ? "Activa" : "Archivada"}</Badge>
                </div>
                <p className="font-bold text-ink">{cup.name}</p>
                <div className="flex items-center gap-4 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <Users size={13} /> {cup._count.entries} equipo(s)
                  </span>
                  <span className="flex items-center gap-1">
                    <Swords size={13} /> {cup._count.matches} partido(s)
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
