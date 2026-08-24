"use client";

import { useState } from "react";
import { SuspensionsTable } from "@/components/tables/SuspensionsTable";
import { CardsTable } from "@/components/tables/CardsTable";
import { CardReasonConfigTable } from "@/components/tables/CardReasonConfigTable";
import { Field, Select } from "@/components/ui/field";

type View = "suspensiones" | "tarjetas" | "config-tarjetas";

const descriptions: Record<View, string> = {
  suspensiones: "Jugadores suspendidos por tarjeta roja.",
  tarjetas: "Todas las tarjetas amarillas y rojas registradas.",
  "config-tarjetas": "Precios por tipo de tarjeta y motivo.",
};

export default function SanctionsPage() {
  const [view, setView] = useState<View>("suspensiones");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink">Sanciones y Tarjetas</h1>
          <p className="text-sm text-muted">{descriptions[view]}</p>
        </div>
        <div className="w-56">
          <Field label="Vista">
            <Select value={view} onChange={(e) => setView(e.target.value as View)}>
              <option value="suspensiones">Suspensiones</option>
              <option value="tarjetas">Tarjetas</option>
              <option value="config-tarjetas">Configuración de tarjetas</option>
            </Select>
          </Field>
        </div>
      </div>

      {view === "suspensiones" && <SuspensionsTable />}
      {view === "tarjetas" && <CardsTable />}
      {view === "config-tarjetas" && <CardReasonConfigTable />}
    </div>
  );
}
