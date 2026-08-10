"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRegisterResult } from "@/hooks/useMatches";
import { ApiError } from "@/lib/errors";
import { Button } from "@/components/ui/button";

export function RegisterResultForm({ matchId, onDone }: { matchId: string; onDone: () => void }) {
  const [homeGoals, setHomeGoals] = useState("");
  const [awayGoals, setAwayGoals] = useState("");
  const registerResult = useRegisterResult();

  const submit = () => {
    if (homeGoals === "" || awayGoals === "") {
      toast.error("Ingresa el marcador de ambos equipos");
      return;
    }
    registerResult.mutate(
      { id: matchId, homeGoals: Number(homeGoals), awayGoals: Number(awayGoals) },
      {
        onSuccess: () => {
          toast.success("Resultado registrado");
          onDone();
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "No se pudo registrar el resultado"),
      }
    );
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      <input
        type="number"
        min={0}
        value={homeGoals}
        onChange={(e) => setHomeGoals(e.target.value)}
        className="w-12 rounded-lg border border-slate-200 px-1.5 py-1.5 text-center text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
        placeholder="L"
      />
      <span className="text-slate-300">-</span>
      <input
        type="number"
        min={0}
        value={awayGoals}
        onChange={(e) => setAwayGoals(e.target.value)}
        className="w-12 rounded-lg border border-slate-200 px-1.5 py-1.5 text-center text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
        placeholder="V"
      />
      <Button variant="secondary" onClick={submit} disabled={registerResult.isPending}>
        Guardar
      </Button>
      <Button variant="ghost" onClick={onDone}>
        Cancelar
      </Button>
    </div>
  );
}
