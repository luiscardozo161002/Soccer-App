"use client";

import { useState } from "react";
import { SuspensionsTable } from "@/components/tables/SuspensionsTable";
import { CardsTable } from "@/components/tables/CardsTable";
import { Field, Select } from "@/components/ui/field";

export default function SanctionsPage() {
  const [view, setView] = useState<"suspensiones" | "tarjetas">("suspensiones");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink">Sanciones</h1>
          <p className="text-sm text-muted">
            {view === "suspensiones"
              ? "Jugadores suspendidos por tarjeta roja."
              : "Todas las tarjetas amarillas y rojas registradas."}
          </p>
        </div>
        <div className="w-48">
          <Field label="Vista">
            <Select value={view} onChange={(e) => setView(e.target.value as "suspensiones" | "tarjetas")}>
              <option value="suspensiones">Suspensiones</option>
              <option value="tarjetas">Tarjetas</option>
            </Select>
          </Field>
        </div>
      </div>

      {view === "suspensiones" ? <SuspensionsTable /> : <CardsTable />}
    </div>
  );
}
