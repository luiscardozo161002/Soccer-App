"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRegisterCupResult, type CupMatch } from "@/hooks/useCupMatches";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { ApiError } from "@/lib/errors";
import { onlyDigits } from "@/lib/utils/forms";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Select, Input } from "@/components/ui/field";
import { useConfirm } from "@/components/ui/confirm-dialog";

export function RegisterCupResultForm({ match, onDone }: { match: CupMatch; onDone: () => void }) {
  const [homeGoals, setHomeGoals] = useState("0");
  const [awayGoals, setAwayGoals] = useState("0");
  const [forfeit, setForfeit] = useState(false);
  const [forfeitWinner, setForfeitWinner] = useState<"home" | "away">("home");
  const [forfeitReason, setForfeitReason] = useState("");

  const registerResult = useRegisterCupResult();
  const { confirm, dialog } = useConfirm();

  useUnsavedChangesWarning(homeGoals !== "0" || awayGoals !== "0" || forfeit || forfeitReason.trim().length > 0);

  const applyForfeitScore = (winner: "home" | "away") => {
    setHomeGoals(winner === "home" ? "3" : "0");
    setAwayGoals(winner === "away" ? "3" : "0");
  };

  const toggleForfeit = (checked: boolean) => {
    setForfeit(checked);
    if (checked) applyForfeitScore(forfeitWinner);
  };

  const changeForfeitWinner = (winner: "home" | "away") => {
    setForfeitWinner(winner);
    applyForfeitScore(winner);
  };

  const isTied = !forfeit && homeGoals !== "" && awayGoals !== "" && Number(homeGoals) === Number(awayGoals);

  const submit = async () => {
    if (homeGoals === "" || awayGoals === "") {
      toast.error("Ingresa el marcador de ambos equipos");
      return;
    }
    if (isTied) {
      toast.error("Un partido de copa no puede quedar empatado — la ronda necesita un ganador");
      return;
    }
    if (forfeit && !forfeitReason.trim()) {
      toast.error("Indica el motivo por el que se ganó por default");
      return;
    }
    const ok = await confirm({
      title: "¿Guardar el resultado?",
      description:
        "El equipo perdedor quedará eliminado de la copa automáticamente. Una vez guardado, este partido ya no se podrá editar (aunque se puede reabrir mientras nadie haya avanzado con este resultado).",
      confirmLabel: "Guardar resultado",
      tone: "primary",
    });
    if (!ok) return;
    registerResult.mutate(
      {
        id: match.id,
        homeGoals: Number(homeGoals),
        awayGoals: Number(awayGoals),
        forfeit,
        forfeitReason: forfeit ? forfeitReason.trim() : undefined,
      },
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
    <>
      <Modal
        open
        onClose={onDone}
        title="Registrar resultado de copa"
        description={`${match.homeTeam.name} vs ${match.awayTeam.name} · ${match.round}`}
      >
        <div className="flex flex-col gap-5">
          <label className="flex items-center gap-2 text-sm font-semibold text-ink">
            <input type="checkbox" checked={forfeit} onChange={(e) => toggleForfeit(e.target.checked)} />
            Ganado por default
          </label>

          {forfeit && (
            <>
              <Field label="¿Quién ganó?">
                <Select value={forfeitWinner} onChange={(e) => changeForfeitWinner(e.target.value as "home" | "away")}>
                  <option value="home">{match.homeTeam.name}</option>
                  <option value="away">{match.awayTeam.name}</option>
                </Select>
              </Field>
              <Field label="Motivo del default">
                <Input
                  value={forfeitReason}
                  onChange={(e) => setForfeitReason(e.target.value)}
                  placeholder="Ej. el equipo visitante no se presentó"
                  maxLength={300}
                />
              </Field>
            </>
          )}

          {!forfeit && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center justify-center gap-4">
                <div className="flex flex-col items-center gap-1.5">
                  <span className="max-w-28 truncate text-xs font-semibold text-muted">{match.homeTeam.name}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={homeGoals}
                    onChange={(e) => setHomeGoals(onlyDigits(e.target.value))}
                    className="w-16 rounded-xl border border-border bg-surface px-2 py-2 text-center text-lg font-bold text-ink outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
                  />
                </div>
                <span className="mt-5 text-muted">-</span>
                <div className="flex flex-col items-center gap-1.5">
                  <span className="max-w-28 truncate text-xs font-semibold text-muted">{match.awayTeam.name}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={awayGoals}
                    onChange={(e) => setAwayGoals(onlyDigits(e.target.value))}
                    className="w-16 rounded-xl border border-border bg-surface px-2 py-2 text-center text-lg font-bold text-ink outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
                  />
                </div>
              </div>
              {isTied && (
                <p className="text-xs font-medium text-red-500">
                  Empate no permitido — marca &ldquo;ganado por default&rdquo; si el partido no se jugó.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="ghost" onClick={onDone}>
              Cancelar
            </Button>
            <Button type="button" onClick={submit} disabled={registerResult.isPending || isTied}>
              {registerResult.isPending ? "Guardando..." : "Guardar resultado"}
            </Button>
          </div>
        </div>
      </Modal>
      {dialog}
    </>
  );
}
