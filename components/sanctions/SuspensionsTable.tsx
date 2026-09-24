"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DollarSign, Undo2 } from "lucide-react";
import { useSanctions, usePaySanction, useRevertSanction, sanctionMatchesRemaining } from "@/modules/sanctions/hooks/useSanctions";
import { playerPhotoUrl } from "@/modules/players/hooks/usePlayers";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { ApiError } from "@/lib/errors";
import { LEAGUE_CATEGORIES, type LeagueCategoryValue } from "@/lib/constants/league-categories";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Field, Input, Select } from "@/components/ui/field";
import { Table, Thead, Th, Tbody, Td, EmptyRow } from "@/components/ui/table";
import { Pagination, DEFAULT_PAGE_SIZE, type PageSize } from "@/components/ui/pagination";
import { CategoryBadge } from "@/components/ui/category-badge";
import { PlayerPhotoModal, type PlayerPhotoModalTarget } from "@/components/ui/player-photo-modal";

export function SuspensionsTable() {
  const [filter, setFilter] = useState<"active" | "resolved">("active");
  const [categoryFilter, setCategoryFilter] = useState<LeagueCategoryValue | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);
  const { data, isLoading, isError } = useSanctions(
    filter === "active" ? false : true,
    page,
    pageSize,
    { search: search.trim() || undefined, category: categoryFilter || undefined }
  );
  const sanctions = data?.data ?? [];
  const paySanction = usePaySanction();
  const revertSanction = useRevertSanction();
  const [viewingPlayer, setViewingPlayer] = useState<PlayerPhotoModalTarget | null>(null);
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
      title: `¿Revertir el pago de ${playerName}?`,
      description: "La multa vuelve a quedar pendiente. La suspensión se reactivará si aún faltan partidos por cumplir.",
      confirmLabel: "Revertir pago",
      tone: "danger",
    });
    if (!ok) return;
    revertSanction.mutate(id, {
      onSuccess: () => toast.success("Pago revertido"),
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
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </Field>
            </div>
            <div className="w-48">
              <Field label="Ver">
                <Select value={filter} onChange={(e) => { setFilter(e.target.value as "active" | "resolved"); setPage(1); }}>
                  <option value="active">Suspensiones activas</option>
                  <option value="resolved">Cumplidas / levantadas</option>
                </Select>
              </Field>
            </div>
            <div className="w-48">
              <Field label="Categoría">
                <Select
                  value={categoryFilter}
                  onChange={(e) => { setCategoryFilter(e.target.value as LeagueCategoryValue | ""); setPage(1); }}
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
                  <button
                    type="button"
                    onClick={() =>
                      setViewingPlayer({
                        name: sanction.card.player.name,
                        photoUrl: playerPhotoUrl(sanction.card.player),
                      })
                    }
                    className="flex items-center gap-2 text-left"
                  >
                    <Avatar src={playerPhotoUrl(sanction.card.player)} name={sanction.card.player.name} size={28} />
                    <span className="font-semibold text-ink hover:text-primary">{sanction.card.player.name}</span>
                  </button>
                </Td>
                <Td>{sanction.card.player.team.name}</Td>
                <Td>
                  <CategoryBadge category={sanction.card.player.team.category as LeagueCategoryValue} />
                </Td>
                <Td className="max-w-xs text-sm text-muted">{sanction.card.detail ?? "—"}</Td>
                <Td className="text-center">
                  {sanction.matchdayStart}–{sanction.matchdayEnd}
                </Td>
                <Td className="text-center">
                  {sanction.fulfilled
                    ? `${sanction._count.appliedMatches}/${sanction.matchesSuspended} cumplidos`
                    : `${sanctionMatchesRemaining(sanction)}/${sanction.matchesSuspended} restantes`}
                </Td>
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
                  ) : sanction.waivedByPayment ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Revertir pago de ${sanction.card.player.name}`}
                      title="Revertir pago"
                      onClick={() => handleRevert(sanction.id, sanction.card.player.name)}
                    >
                      <Undo2 size={16} />
                    </Button>
                  ) : null}
                </Td>
              </tr>
            ))}
          </Tbody>
        </Table>
        <Pagination
          meta={data?.meta}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </Card>
      <PlayerPhotoModal player={viewingPlayer} onClose={() => setViewingPlayer(null)} />
      {dialog}
    </>
  );
}
