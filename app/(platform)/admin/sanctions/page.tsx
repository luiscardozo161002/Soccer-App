"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ShieldAlert, DollarSign, Undo2 } from "lucide-react";
import { useSanctions, usePaySanction, useRevertSanction } from "@/hooks/useSanctions";
import { useCards, usePayCard, useRevertCardPayment, type CardType } from "@/hooks/useCards";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { ApiError } from "@/lib/errors";
import { formatCalendarDate } from "@/lib/date";
import { LEAGUE_CATEGORIES, type LeagueCategoryValue } from "@/lib/constants/league-categories";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Table, Thead, Th, Tbody, Td, EmptyRow } from "@/components/ui/table";
import { CategoryBadge } from "@/components/ui/category-badge";

function SuspensionsView() {
  const [filter, setFilter] = useState<"active" | "resolved">("active");
  const [categoryFilter, setCategoryFilter] = useState<LeagueCategoryValue | "">("");
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useSanctions(filter === "active" ? false : true);
  const term = search.trim().toLowerCase();
  const sanctions = (data?.data ?? []).filter(
    (s) =>
      (!categoryFilter || s.card.player.team.category === categoryFilter) &&
      (!term ||
        s.card.player.name.toLowerCase().includes(term) ||
        s.card.player.team.name.toLowerCase().includes(term) ||
        (s.card.detail ?? "").toLowerCase().includes(term))
  );
  const paySanction = usePaySanction();
  const revertSanction = useRevertSanction();
  const { confirm, dialog } = useConfirm();

  const handlePay = async (id: string, playerName: string, amount: string | null) => {
    const ok = await confirm({
      title: `¿Levantar la suspensión de ${playerName}?`,
      description: amount
        ? `Se registrará como pagada la multa de $${amount} y el jugador queda habilitado de inmediato.`
        : "El jugador queda habilitado de inmediato, antes de cumplir todos sus partidos de suspensión.",
      confirmLabel: "Confirmar pago",
      tone: "primary",
    });
    if (!ok) return;
    paySanction.mutate(id, {
      onSuccess: () => toast.success("Multa pagada, sanción levantada"),
      onError: (error) =>
        toast.error(error instanceof ApiError ? error.message : "No se pudo levantar la sanción"),
    });
  };

  const handleRevert = async (id: string, playerName: string) => {
    const ok = await confirm({
      title: `¿Reabrir la suspensión de ${playerName}?`,
      description: "La sanción vuelve a quedar activa, como si no se hubiera cumplido ni pagado.",
      confirmLabel: "Reabrir sanción",
      tone: "danger",
    });
    if (!ok) return;
    revertSanction.mutate(id, {
      onSuccess: () => toast.success("Sanción reabierta"),
      onError: (error) =>
        toast.error(error instanceof ApiError ? error.message : "No se pudo reabrir la sanción"),
    });
  };

  return (
    <>
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-56">
              <Field label="Buscar">
                <Input
                  placeholder="Jugador, equipo o motivo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </Field>
            </div>
            <div className="w-48">
              <Field label="Ver">
                <Select value={filter} onChange={(e) => setFilter(e.target.value as "active" | "resolved")}>
                  <option value="active">Suspensiones activas</option>
                  <option value="resolved">Cumplidas / levantadas</option>
                </Select>
              </Field>
            </div>
            <div className="w-48">
              <Field label="Categoría">
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as LeagueCategoryValue | "")}
                >
                  <option value="">Todas</option>
                  {LEAGUE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <Table>
          <Thead>
            <Th>Jugador</Th>
            <Th>Equipo</Th>
            <Th>Categoría</Th>
            <Th>Motivo</Th>
            <Th className="text-center">Jornadas</Th>
            <Th className="text-center">Partidos</Th>
            <Th>Estatus</Th>
            <Th className="text-right">Acciones</Th>
          </Thead>
          <Tbody>
            {isLoading && <EmptyRow colSpan={8} message="Cargando..." />}
            {isError && <EmptyRow colSpan={8} message="No se pudo cargar la lista de sanciones." />}
            {!isLoading && !isError && sanctions.length === 0 && (
              <EmptyRow
                colSpan={8}
                message={filter === "active" ? "No hay jugadores suspendidos." : "Todavía no hay sanciones cumplidas."}
              />
            )}
            {sanctions.map((sanction) => (
              <tr key={sanction.id}>
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-300">
                      <ShieldAlert size={15} />
                    </span>
                    <span className="font-semibold text-ink">{sanction.card.player.name}</span>
                  </div>
                </Td>
                <Td>{sanction.card.player.team.name}</Td>
                <Td>
                  <CategoryBadge category={sanction.card.player.team.category as LeagueCategoryValue} />
                </Td>
                <Td className="max-w-xs text-sm text-muted">{sanction.card.detail ?? "—"}</Td>
                <Td className="text-center">
                  {sanction.matchdayStart}–{sanction.matchdayEnd}
                </Td>
                <Td className="text-center">{sanction.matchesSuspended}</Td>
                <Td>
                  {sanction.fulfilled ? (
                    <Badge tone="active">{sanction.waivedByPayment ? "Multa pagada" : "Cumplida"}</Badge>
                  ) : (
                    <Badge tone="cancelled">Suspendido</Badge>
                  )}
                </Td>
                <Td className="text-right">
                  {!sanction.fulfilled ? (
                    <Button
                      variant="secondary"
                      size="icon"
                      aria-label={`Pagar multa de ${sanction.card.player.name}`}
                      title="Pagar multa y levantar sanción"
                      onClick={() => handlePay(sanction.id, sanction.card.player.name, sanction.card.amount)}
                    >
                      <DollarSign size={16} />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Reabrir sanción de ${sanction.card.player.name}`}
                      title="Reabrir sanción"
                      onClick={() => handleRevert(sanction.id, sanction.card.player.name)}
                    >
                      <Undo2 size={16} />
                    </Button>
                  )}
                </Td>
              </tr>
            ))}
          </Tbody>
        </Table>
      </Card>
      {dialog}
    </>
  );
}

function CardsView() {
  const [categoryFilter, setCategoryFilter] = useState<LeagueCategoryValue | "">("");
  const [typeFilter, setTypeFilter] = useState<CardType | "">("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid">("all");
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useCards();
  const term = search.trim().toLowerCase();
  const cards = (data?.data ?? []).filter(
    (c) =>
      (!categoryFilter || c.player.team.category === categoryFilter) &&
      (!typeFilter || c.type === typeFilter) &&
      (statusFilter === "all" || (statusFilter === "paid" ? c.paid : !c.paid)) &&
      (!term ||
        c.player.name.toLowerCase().includes(term) ||
        c.player.team.name.toLowerCase().includes(term) ||
        (c.detail ?? "").toLowerCase().includes(term))
  );
  const payCard = usePayCard();
  const revertCardPayment = useRevertCardPayment();
  const { confirm, dialog } = useConfirm();

  const handlePay = async (id: string, playerName: string, amount: string | null) => {
    const ok = await confirm({
      title: `¿Marcar como pagada la tarjeta de ${playerName}?`,
      description: amount
        ? `Se registrará como pagada la multa de $${amount}.`
        : "Esta tarjeta no tiene una multa asignada; se marcará como pagada de cualquier forma.",
      confirmLabel: "Confirmar pago",
      tone: "primary",
    });
    if (!ok) return;
    payCard.mutate(id, {
      onSuccess: () => toast.success("Multa pagada"),
      onError: (error) =>
        toast.error(error instanceof ApiError ? error.message : "No se pudo registrar el pago"),
    });
  };

  const handleRevert = async (id: string, playerName: string) => {
    const ok = await confirm({
      title: `¿Reabrir la tarjeta de ${playerName}?`,
      description: "La tarjeta vuelve a quedar como pendiente de pago.",
      confirmLabel: "Reabrir",
      tone: "danger",
    });
    if (!ok) return;
    revertCardPayment.mutate(id, {
      onSuccess: () => toast.success("Tarjeta reabierta"),
      onError: (error) =>
        toast.error(error instanceof ApiError ? error.message : "No se pudo reabrir la tarjeta"),
    });
  };

  return (
    <>
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-56">
              <Field label="Buscar">
                <Input
                  placeholder="Jugador, equipo o motivo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </Field>
            </div>
            <div className="w-40">
              <Field label="Tipo">
                <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as CardType | "")}>
                  <option value="">Todas</option>
                  <option value="yellow">Amarilla</option>
                  <option value="red">Roja</option>
                </Select>
              </Field>
            </div>
            <div className="w-40">
              <Field label="Estatus">
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | "pending" | "paid")}>
                  <option value="all">Todas</option>
                  <option value="pending">Pendientes</option>
                  <option value="paid">Pagadas</option>
                </Select>
              </Field>
            </div>
            <div className="w-48">
              <Field label="Categoría">
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as LeagueCategoryValue | "")}
                >
                  <option value="">Todas</option>
                  {LEAGUE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <Table>
          <Thead>
            <Th>Jugador</Th>
            <Th>Equipo</Th>
            <Th>Categoría</Th>
            <Th>Partido</Th>
            <Th>Tarjeta</Th>
            <Th>Motivo</Th>
            <Th className="text-center">Multa</Th>
            <Th>Estatus</Th>
            <Th className="text-right">Acciones</Th>
          </Thead>
          <Tbody>
            {isLoading && <EmptyRow colSpan={9} message="Cargando..." />}
            {isError && <EmptyRow colSpan={9} message="No se pudo cargar la lista de tarjetas." />}
            {!isLoading && !isError && cards.length === 0 && (
              <EmptyRow colSpan={9} message="No hay tarjetas para este filtro." />
            )}
            {cards.map((c) => (
              <tr key={c.id}>
                <Td className="font-semibold text-ink">{c.player.name}</Td>
                <Td>{c.player.team.name}</Td>
                <Td>
                  <CategoryBadge category={c.player.team.category as LeagueCategoryValue} />
                </Td>
                <Td className="text-xs text-muted">
                  {c.match.homeTeam.name} vs {c.match.awayTeam.name}
                  <br />
                  Jornada {c.match.matchday} · {formatCalendarDate(c.match.date)}
                </Td>
                <Td>
                  <Badge tone={c.type}>{c.type === "yellow" ? "Amarilla" : "Roja"}</Badge>
                </Td>
                <Td className="max-w-xs text-sm text-muted">{c.detail ?? "—"}</Td>
                <Td className="text-center">{c.amount ? `$${c.amount}` : "—"}</Td>
                <Td>
                  {c.paid ? <Badge tone="active">Pagada</Badge> : <Badge tone="cancelled">Pendiente</Badge>}
                </Td>
                <Td className="text-right">
                  {!c.paid ? (
                    <Button
                      variant="secondary"
                      size="icon"
                      aria-label={`Pagar multa de ${c.player.name}`}
                      title="Marcar como pagada"
                      onClick={() => handlePay(c.id, c.player.name, c.amount)}
                    >
                      <DollarSign size={16} />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Reabrir tarjeta de ${c.player.name}`}
                      title="Reabrir"
                      onClick={() => handleRevert(c.id, c.player.name)}
                    >
                      <Undo2 size={16} />
                    </Button>
                  )}
                </Td>
              </tr>
            ))}
          </Tbody>
        </Table>
      </Card>
      {dialog}
    </>
  );
}

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

      {view === "suspensiones" ? <SuspensionsView /> : <CardsView />}
    </div>
  );
}
