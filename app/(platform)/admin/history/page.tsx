"use client";

import Link from "next/link";
import { History, ChevronRight } from "lucide-react";
import { useSeasons } from "@/hooks/useSeasons";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HistoryPage() {
  const { data, isLoading, isError } = useSeasons();
  const seasons = data?.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Historial de torneos</h1>
        <p className="text-sm text-muted">Temporadas activas y archivadas de la liga.</p>
      </div>

      <Card>
        {isLoading && <p className="p-8 text-center text-sm text-muted">Cargando...</p>}
        {isError && <p className="p-8 text-center text-sm text-muted">No se pudo cargar el historial.</p>}
        {!isLoading && !isError && seasons.length === 0 && (
          <p className="p-8 text-center text-sm text-muted">Todavía no hay temporadas registradas.</p>
        )}
        {seasons.length > 0 && (
          <ul className="divide-y divide-border">
            {seasons.map((season) => (
              <li key={season.id}>
                <Link
                  href={`/admin/history/${season.id}`}
                  className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-primary-light/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
                      <History size={16} />
                    </span>
                    <div>
                      <p className="font-semibold text-ink">{season.name}</p>
                      <p className="text-xs text-muted">
                        {new Date(season.startDate).toLocaleDateString("es-MX")} —{" "}
                        {season.endDate ? new Date(season.endDate).toLocaleDateString("es-MX") : "presente"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={season.status === "active" ? "active" : "inactive"}>
                      {season.status === "active" ? "Activa" : "Archivada"}
                    </Badge>
                    <ChevronRight size={16} className="text-muted" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
