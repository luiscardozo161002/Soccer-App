"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, X, Trash2 } from "lucide-react";
import { useRegisterResult } from "@/hooks/useMatches";
import { useCards, useCreateCard, useDeleteCard, type CardType } from "@/hooks/useCards";
import { useCreateSanction, useSanctions, activeSanctionsByPlayer, sanctionMatchesRemaining } from "@/hooks/useSanctions";
import { usePlayers } from "@/hooks/usePlayers";
import { useMatchEvidence } from "@/hooks/useMatchEvidence";
import { useCardReasonConfigs } from "@/hooks/useCardReasonConfigs";
import { ApiError } from "@/lib/errors";
import { onlyDigits } from "@/lib/utils/forms";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { EmptyOptionsHint } from "@/components/ui/empty-options-hint";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { MatchEvidenceUploader } from "@/components/forms/MatchEvidenceUploader";

export interface RegisterResultMatch {
  id: string;
  matchday: number;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
}

export interface RegisterResultInitialValues {
  homeGoals: number;
  awayGoals: number;
  forfeit: boolean;
  forfeitReason: string | null;
}

function CardForm({ match, onAdded }: { match: RegisterResultMatch; onAdded: () => void }) {
  const [teamId, setTeamId] = useState(match.homeTeamId);
  const [playerId, setPlayerId] = useState("");
  const [type, setType] = useState<CardType>("yellow");
  const [matchesSuspended, setMatchesSuspended] = useState("3");

  const { data: playersData } = usePlayers({ teamId });
  const players = playersData?.data ?? [];

  const { data: activeSanctionsData } = useSanctions(false, 1, 100);
  const sanctionsByPlayer = activeSanctionsByPlayer(activeSanctionsData?.data ?? []);

  const { data: reasonConfigsData } = useCardReasonConfigs({ cardType: type, active: true });
  const reasonConfigs = reasonConfigsData?.data ?? [];
  const [reason, setReason] = useState<string>("");
  const selectedConfig = reasonConfigs.find((r) => r.reason === reason);

  const createCard = useCreateCard();
  const createSanction = useCreateSanction();

  const submit = () => {
    if (!playerId) {
      toast.error("Selecciona un jugador");
      return;
    }
    if (!reason) {
      toast.error("Selecciona un motivo");
      return;
    }
    createCard.mutate(
      {
        playerId,
        matchId: match.id,
        type,
        detail: reason,
      },
      {
        onSuccess: (res) => {
          if (type === "red") {
            const n = Math.max(1, Number(matchesSuspended) || 1);
            createSanction.mutate(
              {
                cardId: res.data.id,
                matchdayStart: match.matchday + 1,
                matchdayEnd: match.matchday + n,
                matchesSuspended: n,
              },
              {
                onError: (error) =>
                  toast.error(
                    error instanceof ApiError
                      ? error.message
                      : "La tarjeta se guardó, pero no se pudo registrar la suspensión"
                  ),
              }
            );
          }
          toast.success("Tarjeta registrada");
          setPlayerId("");
          setReason("");
          onAdded();
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "No se pudo registrar la tarjeta"),
      }
    );
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Equipo">
          <Select
            value={teamId}
            onChange={(e) => {
              setTeamId(e.target.value);
              setPlayerId("");
            }}
          >
            <option value={match.homeTeamId}>{match.homeTeamName}</option>
            <option value={match.awayTeamId}>{match.awayTeamName}</option>
          </Select>
        </Field>
        <Field label="Jugador">
          {players.length === 0 ? (
            <EmptyOptionsHint
              message="Este equipo no tiene jugadores registrados."
              href="/admin/players"
              linkLabel="Crea uno primero"
            />
          ) : (
            <Select value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
              <option value="">Selecciona...</option>
              {players.map((p) => {
                const sanction = sanctionsByPlayer.get(p.id);
                return (
                  <option key={p.id} value={p.id} disabled={!!sanction}>
                    {sanction
                      ? `${p.name} — no puede jugar (${sanction._count.appliedMatches}/${sanction.matchesSuspended}, faltan ${sanctionMatchesRemaining(sanction)})`
                      : p.name}
                  </option>
                );
              })}
            </Select>
          )}
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tarjeta">
          <Select
            value={type}
            onChange={(e) => {
              setType(e.target.value as CardType);
              setReason("");
            }}
          >
            <option value="yellow">Amarilla</option>
            <option value="red">Roja</option>
          </Select>
        </Field>
        <Field label="Multa">
          <p className="flex h-9 items-center rounded-xl border border-dashed border-border bg-surface px-3 text-sm font-semibold text-ink">
            {selectedConfig ? `$${selectedConfig.amount}` : "—"}
          </p>
        </Field>
      </div>

      <Field label="Motivo">
        {reasonConfigs.length === 0 ? (
          <EmptyOptionsHint
            message="No hay motivos configurados para este tipo de tarjeta."
            href="/admin/sanctions"
            linkLabel="Configúralos primero"
          />
        ) : (
          <Select value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="">Selecciona...</option>
            {reasonConfigs.map((r) => (
              <option key={r.id} value={r.reason}>
                {r.reason}
              </option>
            ))}
          </Select>
        )}
      </Field>

      {type === "red" && (
        <Field label="Partidos de suspensión">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            value={matchesSuspended}
            onChange={(e) => setMatchesSuspended(onlyDigits(e.target.value))}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
          />
        </Field>
      )}

      <Button type="button" variant="secondary" onClick={submit} disabled={createCard.isPending}>
        {createCard.isPending ? "Guardando..." : "Agregar tarjeta"}
      </Button>
    </div>
  );
}

export function RegisterResultForm({
  match,
  onDone,
  initialResult,
}: {
  match: RegisterResultMatch;
  onDone: () => void;
  // Presence of this prop is what puts the form in "edit" mode — an admin
  // correcting an already-confirmed result, instead of the first registration.
  initialResult?: RegisterResultInitialValues;
}) {
  const isEditing = !!initialResult;
  const [homeGoals, setHomeGoals] = useState(String(initialResult?.homeGoals ?? 0));
  const [awayGoals, setAwayGoals] = useState(String(initialResult?.awayGoals ?? 0));
  const [forfeit, setForfeit] = useState(initialResult?.forfeit ?? false);
  const [forfeitWinner, setForfeitWinner] = useState<"home" | "away">(
    initialResult?.forfeit && (initialResult.awayGoals ?? 0) > (initialResult.homeGoals ?? 0) ? "away" : "home"
  );
  const [forfeitReason, setForfeitReason] = useState(initialResult?.forfeitReason ?? "");
  const [showCardForm, setShowCardForm] = useState(false);

  const registerResult = useRegisterResult();
  const { data: cardsData } = useCards(match.id);
  const cards = cardsData?.data ?? [];
  const deleteCard = useDeleteCard();
  const { data: evidenceData } = useMatchEvidence(match.id);
  // Both sides of the cédula arbitral are required, not just any one photo.
  const hasEvidence = (evidenceData?.data.length ?? 0) >= 2;
  const { confirm, dialog } = useConfirm();

  const { data: playersData } = usePlayers();
  const playersById = Object.fromEntries((playersData?.data ?? []).map((p) => [p.id, p.name]));

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

  const submit = async () => {
    if (homeGoals === "" || awayGoals === "") {
      toast.error("Ingresa el marcador de ambos equipos");
      return;
    }
    if (forfeit && !forfeitReason.trim()) {
      toast.error("Indica el motivo por el que se ganó por default");
      return;
    }
    if (!hasEvidence) {
      toast.error("Sube el anverso y el reverso de la cédula arbitral antes de guardar el resultado");
      return;
    }
    const ok = await confirm({
      title: isEditing ? "¿Corregir el resultado?" : "¿Guardar el resultado?",
      description: isEditing
        ? "Este partido ya estaba confirmado. Verifica que la corrección sea la correcta antes de continuar."
        : "Una vez guardado, el marcador, las tarjetas y las sanciones de este partido ya no se podrán editar. Verifica que todo esté correcto antes de continuar.",
      confirmLabel: isEditing ? "Guardar corrección" : "Guardar resultado",
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
          toast.success(isEditing ? "Resultado corregido" : "Resultado registrado");
          onDone();
        },
        onError: (error) =>
          toast.error(
            error instanceof ApiError
              ? error.message
              : isEditing
                ? "No se pudo corregir el resultado"
                : "No se pudo registrar el resultado"
          ),
      }
    );
  };

  return (
    <>
      <Modal
        open
        onClose={onDone}
        title={isEditing ? "Editar resultado" : "Registrar resultado"}
        description={`${match.homeTeamName} vs ${match.awayTeamName} · Jornada ${match.matchday}`}
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
                  <option value="home">{match.homeTeamName}</option>
                  <option value="away">{match.awayTeamName}</option>
                </Select>
              </Field>
              <Field label="Motivo del default">
                <input
                  value={forfeitReason}
                  onChange={(e) => setForfeitReason(e.target.value)}
                  placeholder="Ej. el equipo visitante no se presentó"
                  maxLength={300}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
                />
              </Field>
            </>
          )}

          {!forfeit && (
            <div className="flex items-center justify-center gap-4">
              <div className="flex flex-col items-center gap-1.5">
                <span className="max-w-28 truncate text-xs font-semibold text-muted">{match.homeTeamName}</span>
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
                <span className="max-w-28 truncate text-xs font-semibold text-muted">{match.awayTeamName}</span>
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
          )}

          <MatchEvidenceUploader matchId={match.id} />

          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-ink">Tarjetas</p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowCardForm((v) => !v)}
                aria-label={showCardForm ? "Cerrar formulario de tarjeta" : "Agregar tarjeta"}
              >
                {showCardForm ? <X size={16} /> : <Plus size={16} />}
              </Button>
            </div>

            {cards.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {cards.map((card) => (
                  <li
                    key={card.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-primary-light/30 px-3 py-2 text-xs"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`h-3 w-2.5 shrink-0 rounded-[2px] ${card.type === "yellow" ? "bg-yellow-400" : "bg-red-500"
                          }`}
                      />
                      <span className="font-semibold text-ink">{playersById[card.playerId] ?? "Jugador"}</span>
                      {card.detail && <span className="text-muted">— {card.detail}</span>}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteCard.mutate(card.id)}
                      aria-label="Eliminar tarjeta"
                      className="shrink-0 text-muted hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {showCardForm && (
              <CardForm match={match} onAdded={() => setShowCardForm(false)} />
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="ghost" onClick={onDone}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={submit}
              disabled={registerResult.isPending || !hasEvidence}
              title={!hasEvidence ? "Sube el anverso y el reverso de la cédula arbitral primero" : undefined}
            >
              {registerResult.isPending ? "Guardando..." : isEditing ? "Guardar corrección" : "Guardar resultado"}
            </Button>
          </div>
        </div>
      </Modal>
      {dialog}
    </>
  );
}
