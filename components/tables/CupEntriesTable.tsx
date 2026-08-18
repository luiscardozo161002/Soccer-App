"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserPlus, LogOut } from "lucide-react";
import { useCupEntries, useAddCupEntries, useWithdrawCupEntry, type CupEntry } from "@/hooks/useCupEntries";
import { useTeams } from "@/hooks/useTeams";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { ApiError } from "@/lib/errors";
import { LEAGUE_CATEGORIES } from "@/lib/constants/league-categories";
import { Card, CardHeader } from "@/components/ui/card";
import { Table, Thead, Th, Tbody, Td, EmptyRow } from "@/components/ui/table";
import { Pagination, PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE, type PageSize } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { CategoryBadge } from "@/components/ui/category-badge";
import { Modal } from "@/components/ui/modal";

const entryStatusLabels: Record<CupEntry["status"], string> = {
  active: "Activo",
  eliminated: "Eliminado",
  withdrawn: "Retirado",
};

// Largest page size the UI offers — used to fetch the whole roster in one
// request just to know which teams are already in, independent of
// whatever page the table itself happens to be showing.
const MAX_PAGE_SIZE = PAGE_SIZE_OPTIONS[PAGE_SIZE_OPTIONS.length - 1];

function AddTeamsModal({ cupId, onClose }: { cupId: string; onClose: () => void }) {
  const { data: entriesData } = useCupEntries(cupId, 1, MAX_PAGE_SIZE);
  const excludeTeamIds = new Set((entriesData?.data ?? []).map((e) => e.teamId));
  const { data: teamsData } = useTeams();
  const teams = (teamsData?.data ?? []).filter((t) => !excludeTeamIds.has(t.id));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const addEntries = useAddCupEntries();

  useUnsavedChangesWarning(selected.size > 0);

  const toggle = (teamId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  };

  const toggleCategory = (categoryTeamIds: string[], allSelected: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of categoryTeamIds) {
        if (allSelected) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  };

  const submit = () => {
    if (selected.size === 0) return;
    addEntries.mutate(
      { cupId, teamIds: [...selected] },
      {
        onSuccess: () => {
          toast.success(`${selected.size} equipo(s) inscrito(s)`);
          onClose();
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "No se pudieron inscribir los equipos"),
      }
    );
  };

  return (
    <Modal open onClose={onClose} title="Inscribir equipos" description="Cualquier categoría puede cruzar contra otra.">
      <div className="flex flex-col gap-4">
        {teams.length === 0 ? (
          <p className="text-sm text-muted">Todos los equipos ya están inscritos en esta copa.</p>
        ) : (
          <div className="max-h-80 overflow-y-auto rounded-xl border border-border">
            {LEAGUE_CATEGORIES.map((cat) => {
              const categoryTeams = teams.filter((t) => t.category === cat.value);
              if (categoryTeams.length === 0) return null;
              const categoryIds = categoryTeams.map((t) => t.id);
              const allSelected = categoryIds.every((id) => selected.has(id));
              return (
                <div key={cat.value} className="border-b border-border last:border-b-0">
                  <label className="flex items-center gap-2 bg-primary-light/30 px-3 py-2 text-xs font-bold uppercase tracking-wide text-ink">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => toggleCategory(categoryIds, allSelected)}
                    />
                    {cat.label} ({categoryTeams.length})
                  </label>
                  <div className="flex flex-col">
                    {categoryTeams.map((team) => (
                      <label key={team.id} className="flex items-center gap-2 px-4 py-1.5 text-sm text-ink hover:bg-primary-light/20">
                        <input type="checkbox" checked={selected.has(team.id)} onChange={() => toggle(team.id)} />
                        {team.name}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted">{selected.size} equipo(s) seleccionado(s)</p>
          <Button onClick={submit} disabled={selected.size === 0 || addEntries.isPending}>
            {addEntries.isPending ? "Inscribiendo..." : "Inscribir equipos"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function WithdrawModal({ entry, onClose }: { entry: CupEntry; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const withdraw = useWithdrawCupEntry();

  useUnsavedChangesWarning(reason.trim().length > 0);

  const submit = () => {
    if (!reason.trim()) {
      toast.error("Indica el motivo del retiro");
      return;
    }
    withdraw.mutate(
      { id: entry.id, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success(`${entry.team.name} quedó fuera de la copa`);
          onClose();
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "No se pudo retirar al equipo"),
      }
    );
  };

  return (
    <Modal open onClose={onClose} title={`Retirar a ${entry.team.name}`}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          Si el equipo tiene un partido pendiente en esta copa, se marcará automáticamente como ganado por
          default para su rival.
        </p>
        <Field label="Motivo del retiro">
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Retiro voluntario"
            maxLength={300}
            autoFocus
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={submit} disabled={withdraw.isPending}>
            {withdraw.isPending ? "Retirando..." : "Retirar equipo"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function CupEntriesTable({ cupId }: { cupId: string }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);
  const { data, isLoading, isError } = useCupEntries(cupId, page, pageSize);
  const entries = data?.data ?? [];
  const [showAddTeams, setShowAddTeams] = useState(false);
  const [withdrawingEntry, setWithdrawingEntry] = useState<CupEntry | null>(null);

  return (
    <Card>
      <CardHeader
        title="Equipos inscritos"
        description={`${data?.meta.totalItems ?? 0} equipo(s) en esta copa.`}
        action={
          <Button onClick={() => setShowAddTeams(true)}>
            <UserPlus size={16} />
            Inscribir equipos
          </Button>
        }
      />
      <Table>
        <Thead>
          <Th>Equipo</Th>
          <Th>Categoría</Th>
          <Th>Estatus</Th>
          <Th className="text-right">Acciones</Th>
        </Thead>
        <Tbody>
          {isLoading && <EmptyRow colSpan={4} message="Cargando..." />}
          {isError && <EmptyRow colSpan={4} message="No se pudo cargar el roster." />}
          {!isLoading && !isError && entries.length === 0 && (
            <EmptyRow colSpan={4} message="Todavía no hay equipos inscritos." />
          )}
          {entries.map((entry) => (
            <tr key={entry.id}>
              <Td className="font-semibold text-ink">{entry.team.name}</Td>
              <Td>
                <CategoryBadge category={entry.team.category} />
              </Td>
              <Td>
                <Badge tone={entry.status}>{entryStatusLabels[entry.status]}</Badge>
                {entry.eliminatedReason && (
                  <span className="ml-1.5 text-xs text-muted">— {entry.eliminatedReason}</span>
                )}
              </Td>
              <Td className="text-right">
                {entry.status === "active" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Retirar a ${entry.team.name}`}
                    title="Retirar de la copa"
                    onClick={() => setWithdrawingEntry(entry)}
                  >
                    <LogOut size={16} />
                  </Button>
                )}
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

      {showAddTeams && <AddTeamsModal cupId={cupId} onClose={() => setShowAddTeams(false)} />}
      {withdrawingEntry && <WithdrawModal entry={withdrawingEntry} onClose={() => setWithdrawingEntry(null)} />}
    </Card>
  );
}
