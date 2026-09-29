"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, X, Trash2, Pencil } from "lucide-react";
import { useRegisterResult } from "@/modules/matches/hooks/useMatches";
import { useCards, useCreateCard, useDeleteCard, useUpdateCardDetails, useCardReasonConfigs, type CardType, type MatchCard } from "@/modules/cards/hooks/useCards";
import { useAllActiveSanctions, activeSanctionsByPlayer, sanctionMatchesRemaining } from "@/modules/sanctions/hooks/useSanctions";
import { usePlayers } from "@/modules/players/hooks/usePlayers";
import { ApiError } from "@/lib/errors";
import { onlyDigits } from "@/lib/utils/forms";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { EmptyOptionsHint } from "@/components/ui/empty-options-hint";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { MatchEvidenceUploader } from "@/components/matches/MatchEvidenceUploader";

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

function CardForm({ match, initialCard, onAdded, onSavingChange }: { match: RegisterResultMatch; initialCard?: MatchCard; onAdded: () => void; onSavingChange: (saving: boolean) => void }) {
  const [teamId, setTeamId] = useState(initialCard?.player.team.id ?? match.homeTeamId);
  const [playerId, setPlayerId] = useState(initialCard?.playerId ?? "");
  const [type, setType] = useState<CardType>(initialCard?.type ?? "yellow");
  const [matchesSuspended, setMatchesSuspended] = useState(String(initialCard?.sanction?.matchesSuspended ?? 3));

  const { data: playersData } = usePlayers({ teamId });
  const players = playersData?.data ?? [];

  const { data: activeSanctions } = useAllActiveSanctions();
  const sanctionsByPlayer = activeSanctionsByPlayer(activeSanctions ?? []);

  const { data: reasonConfigsData } = useCardReasonConfigs({ cardType: type, active: true });
  const reasonConfigs = reasonConfigsData?.data ?? [];
  const [reason, setReason] = useState<string>(initialCard?.detail ?? "");
  const selectedConfig = reasonConfigs.find((r) => r.reason === reason);

  const createCard = useCreateCard();
  const updateCard = useUpdateCardDetails();

  const submit = () => {
    if (!playerId) {
      toast.error("Selecciona un jugador");
      return;
    }
    if (!reason) {
      toast.error("Selecciona un motivo");
      return;
    }
    const suspendedMatches = Number(matchesSuspended);
    if (type === "red" && (!Number.isInteger(suspendedMatches) || suspendedMatches < 1 || suspendedMatches > 99)) {
      toast.error("Ingresa entre 1 y 99 partidos de suspensión");
      return;
    }
    onSavingChange(true);
    const details = { playerId, type, detail: reason, matchesSuspended: type === "red" ? suspendedMatches : undefined };
    const callbacks = {
      onSettled: () => onSavingChange(false),
      onSuccess: () => {
        toast.success(initialCard ? "Tarjeta actualizada" : "Tarjeta registrada");
        onAdded();
      },
      onError: (error: Error) =>
        toast.error(error instanceof ApiError ? error.message : "No se pudo guardar la tarjeta"),
    };
    if (initialCard) {
      updateCard.mutate({ id: initialCard.id, ...details }, callbacks);
    } else {
      createCard.mutate({ matchId: match.id, ...details }, callbacks);
    }
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
                const sanctions = sanctionsByPlayer.get(p.id) ?? [];
                const sanction = sanctions[0];
                return (
                  <option key={p.id} value={p.id} disabled={sanctions.length > 0}>
                    {sanction
                      ? sanctions.length === 1
                        ? `${p.name} — no puede jugar (${sanction._count.appliedMatches}/${sanction.matchesSuspended}, faltan ${sanctionMatchesRemaining(sanction)})`
                        : `${p.name} — no puede jugar (${sanctions.length} sanciones activas)`
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

      <Button type="button" variant="secondary" onClick={submit} disabled={createCard.isPending || updateCard.isPending}>
        {createCard.isPending || updateCard.isPending ? "Guardando..." : initialCard ? "Guardar tarjeta" : "Agregar tarjeta"}
      </Button>
    </div>
  );
}

export function RegisterResultForm({
  match,
  onDone,
  initialResult,
  scoreReadOnly = false,
}: {
  match: RegisterResultMatch;
  onDone: () => void;
  initialResult?: RegisterResultInitialValues;
  scoreReadOnly?: boolean;
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
  const [editingCard, setEditingCard] = useState<MatchCard | null>(null);
  const [cardSaving, setCardSaving] = useState(false);

  const registerResult = useRegisterResult();
  const { data: cardsData } = useCards(match.id);
  const cards = cardsData?.data ?? [];
  const deleteCard = useDeleteCard();
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
    if (cardSaving || deleteCard.isPending) {
      toast.error("Espera a que termine de guardarse la tarjeta");
      return;
    }
    if (homeGoals === "" || awayGoals === "") {
      toast.error("Ingresa el marcador de ambos equipos");
      return;
    }
    if (forfeit && !forfeitReason.trim()) {
      toast.error("Indica el motivo por el que se ganó por default");
      return;
    }
    const ok = await confirm({
      title: isEditing ? "¿Corregir el resultado?" : "¿Guardar el resultado?",
      description: isEditing
        ? "Este partido ya estaba confirmado. Verifica que la corrección sea la correcta antes de continuar."
        : "El marcador quedará confirmado. La cédula arbitral y las tarjetas se podrán agregar o corregir después.",
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
        title={scoreReadOnly ? "Cédula y tarjetas" : isEditing ? "Editar resultado" : "Registrar resultado"}
        description={`${match.homeTeamName} vs ${match.awayTeamName} · Jornada ${match.matchday}`}
      >
        <div className="flex flex-col gap-5">
          <label className="flex items-center gap-2 text-sm font-semibold text-ink">
            <input type="checkbox" checked={forfeit} disabled={scoreReadOnly} onChange={(e) => toggleForfeit(e.target.checked)} />
            Ganado por default
          </label>

          {forfeit && (
            <>
              <Field label="¿Quién ganó?">
                <Select value={forfeitWinner} disabled={scoreReadOnly} onChange={(e) => changeForfeitWinner(e.target.value as "home" | "away")}>
                  <option value="home">{match.homeTeamName}</option>
                  <option value="away">{match.awayTeamName}</option>
                </Select>
              </Field>
              <Field label="Motivo del default">
                <input
                  value={forfeitReason}
                  disabled={scoreReadOnly}
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
                  disabled={scoreReadOnly}
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
                  disabled={scoreReadOnly}
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
                onClick={() => { setEditingCard(null); setShowCardForm((v) => !v); }}
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
                    <span className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => { setShowCardForm(false); setEditingCard(card); }}
                        aria-label={`Editar tarjeta de ${playersById[card.playerId] ?? "jugador"}`}
                        className="text-muted hover:text-primary"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCard.mutate(card.id, {
                          onSuccess: () => { if (editingCard?.id === card.id) setEditingCard(null); },
                          onError: (error) => toast.error(error instanceof ApiError ? error.message : "No se pudo eliminar la tarjeta"),
                        })}
                        aria-label="Eliminar tarjeta"
                        className="text-muted hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {showCardForm && (
              <CardForm match={match} onAdded={() => setShowCardForm(false)} onSavingChange={setCardSaving} />
            )}
            {editingCard && (
              <CardForm key={editingCard.id} match={match} initialCard={editingCard} onAdded={() => setEditingCard(null)} onSavingChange={setCardSaving} />
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="ghost" onClick={onDone}>
              {scoreReadOnly ? "Cerrar" : "Cancelar"}
            </Button>
            {!scoreReadOnly && (
              <Button type="button" onClick={submit} disabled={registerResult.isPending || cardSaving || deleteCard.isPending}>
                {registerResult.isPending ? "Guardando..." : isEditing ? "Guardar corrección" : "Guardar resultado"}
              </Button>
            )}
          </div>
        </div>
      </Modal>
      {dialog}
    </>
  );
}
