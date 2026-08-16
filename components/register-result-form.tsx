"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, X, Trash2 } from "lucide-react";
import { useRegisterResult } from "@/hooks/useMatches";
import { useCards, useCreateCard, useDeleteCard, type CardType } from "@/hooks/useCards";
import { useCreateSanction } from "@/hooks/useSanctions";
import { usePlayers } from "@/hooks/usePlayers";
import { ApiError } from "@/lib/errors";
import { CARD_REASONS } from "@/lib/constants/card-reasons";
import { onlyDigits, onlyDecimal } from "@/lib/forms";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { useConfirm } from "@/components/ui/confirm-dialog";

export interface RegisterResultMatch {
  id: string;
  matchday: number;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
}

function CardForm({ match, onAdded }: { match: RegisterResultMatch; onAdded: () => void }) {
  const [teamId, setTeamId] = useState(match.homeTeamId);
  const [playerId, setPlayerId] = useState("");
  const [type, setType] = useState<CardType>("yellow");
  const [reason, setReason] = useState<string>(CARD_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [amount, setAmount] = useState("");
  const [matchesSuspended, setMatchesSuspended] = useState("3");

  const { data: playersData } = usePlayers({ teamId });
  const players = playersData?.data ?? [];

  const createCard = useCreateCard();
  const createSanction = useCreateSanction();

  const detail = reason === "Otro" ? customReason : reason;

  const submit = () => {
    if (!playerId) {
      toast.error("Selecciona un jugador");
      return;
    }
    createCard.mutate(
      {
        playerId,
        matchId: match.id,
        type,
        amount: amount ? Number(amount) : undefined,
        detail: detail || undefined,
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
          setCustomReason("");
          setAmount("");
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
          <Select value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
            <option value="">Selecciona...</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tarjeta">
          <Select value={type} onChange={(e) => setType(e.target.value as CardType)}>
            <option value="yellow">Amarilla</option>
            <option value="red">Roja</option>
          </Select>
        </Field>
        <Field label="Multa (opcional)">
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(onlyDecimal(e.target.value))}
            placeholder="$"
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
          />
        </Field>
      </div>

      <Field label="Motivo">
        <Select value={reason} onChange={(e) => setReason(e.target.value)}>
          {CARD_REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      </Field>
      {reason === "Otro" && (
        <input
          value={customReason}
          onChange={(e) => setCustomReason(e.target.value)}
          placeholder="Describe el motivo"
          maxLength={255}
          className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
        />
      )}

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

export function RegisterResultForm({ match, onDone }: { match: RegisterResultMatch; onDone: () => void }) {
  const [homeGoals, setHomeGoals] = useState("0");
  const [awayGoals, setAwayGoals] = useState("0");
  const [forfeit, setForfeit] = useState(false);
  const [forfeitWinner, setForfeitWinner] = useState<"home" | "away">("home");
  const [forfeitReason, setForfeitReason] = useState("");
  const [showCardForm, setShowCardForm] = useState(false);

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
    if (homeGoals === "" || awayGoals === "") {
      toast.error("Ingresa el marcador de ambos equipos");
      return;
    }
    if (forfeit && !forfeitReason.trim()) {
      toast.error("Indica el motivo por el que se ganó por default");
      return;
    }
    const ok = await confirm({
      title: "¿Guardar el resultado?",
      description:
        "Una vez guardado, el marcador, las tarjetas y las sanciones de este partido ya no se podrán editar. Verifica que todo esté correcto antes de continuar.",
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
        title="Registrar resultado"
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
            <Button type="button" onClick={submit} disabled={registerResult.isPending}>
              {registerResult.isPending ? "Guardando..." : "Guardar resultado"}
            </Button>
          </div>
        </div>
      </Modal>
      {dialog}
    </>
  );
}
