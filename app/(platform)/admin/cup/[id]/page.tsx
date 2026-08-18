"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCup } from "@/hooks/useCups";
import { CupEntriesTable } from "@/components/tables/CupEntriesTable";
import { CupMatchesTable } from "@/components/tables/CupMatchesTable";
import { Badge } from "@/components/ui/badge";

export default function CupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, isError } = useCup(id);
  const cup = data?.data;

  if (isLoading) return <p className="text-sm text-muted">Cargando...</p>;
  if (isError || !cup) return <p className="text-sm text-muted">No se pudo cargar esta copa.</p>;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/admin/cup" className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
          <ArrowLeft size={15} /> Volver a copas
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-extrabold tracking-tight text-ink">{cup.name}</h1>
          <Badge tone={cup.status}>{cup.status === "active" ? "Activa" : "Archivada"}</Badge>
        </div>
        <p className="text-sm text-muted">
          Eliminación directa, separada de la tabla de posiciones de la liga.
        </p>
      </div>

      <CupEntriesTable cupId={id} />
      <CupMatchesTable cupId={id} />
    </div>
  );
}
