"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { History, RotateCcw } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useResetTournament } from "@/hooks/useTournament";
import { useSeasons, useUpdateSeason } from "@/hooks/useSeasons";
import { useMe } from "@/hooks/useAuth";
import { ApiError } from "@/lib/errors";
import { onlyDigits, blockNonIntegerKeys } from "@/lib/utils/forms";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { EditFormFooter } from "@/components/ui/edit-form-footer";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { BrandingForm } from "@/components/forms/BrandingForm";
import { MyProfileForm } from "@/components/forms/MyProfileForm";
import { AdminUsersTable } from "@/components/tables/AdminUsersTable";

export default function SettingsPage() {
  const { data, isLoading } = useSettings();
  const settings = data?.data;
  const resetTournament = useResetTournament();
  const { confirm, dialog } = useConfirm();
  const { data: meData } = useMe();
  const me = meData?.data;

  const { data: seasonsData } = useSeasons();
  const activeSeason = seasonsData?.data.find((s) => s.status === "active");
  const updateSeason = useUpdateSeason();
  const [minMatchesPlayoffs, setMinMatchesPlayoffs] = useState("");
  const [isEditingPlayoffs, setIsEditingPlayoffs] = useState(false);

  useEffect(() => {
    setMinMatchesPlayoffs(activeSeason?.minMatchesPlayoffs?.toString() ?? "");
    setIsEditingPlayoffs(false);
  }, [activeSeason]);

  const isDirtyPlayoffs = minMatchesPlayoffs !== (activeSeason?.minMatchesPlayoffs?.toString() ?? "");
  useUnsavedChangesWarning(isEditingPlayoffs && isDirtyPlayoffs);

  const handleCancelPlayoffs = () => {
    setMinMatchesPlayoffs(activeSeason?.minMatchesPlayoffs?.toString() ?? "");
    setIsEditingPlayoffs(false);
  };

  const handleSavePlayoffs = () => {
    if (!activeSeason) return;
    updateSeason.mutate(
      { id: activeSeason.id, minMatchesPlayoffs: minMatchesPlayoffs ? Number(minMatchesPlayoffs) : null },
      {
        onSuccess: () => {
          toast.success("Mínimo de partidos actualizado");
          setIsEditingPlayoffs(false);
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "No se pudo actualizar el mínimo de partidos"),
      }
    );
  };

  const handleReset = async () => {
    const ok = await confirm({
      title: "¿Reiniciar el torneo?",
      description:
        "Se archivará la temporada activa (con su tabla final visible en el historial) y se abrirá una nueva vacía. Los equipos, jugadores y canchas se conservan.",
      confirmLabel: "Reiniciar torneo",
      tone: "danger",
    });
    if (!ok) return;
    resetTournament.mutate(undefined, {
      onSuccess: () => toast.success("Torneo reiniciado"),
      onError: (error) =>
        toast.error(error instanceof ApiError ? error.message : "No se pudo reiniciar el torneo"),
    });
  };

  if (isLoading || !settings) {
    return <p className="text-sm text-muted">Cargando...</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-ink">Configuración</h1>
        <p className="text-sm text-muted">Marca, tema y administración del torneo.</p>
      </div>

      <BrandingForm settings={settings} />

      <Card>
        <CardHeader title="Torneo" description="Historial y reinicio de temporada." />
        <CardBody>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/admin/history">
              <Button variant="secondary">
                <History size={16} />
                Ver historial de torneos
              </Button>
            </Link>
            <Button variant="danger" onClick={handleReset} disabled={resetTournament.isPending}>
              <RotateCcw size={16} />
              {resetTournament.isPending ? "Reiniciando..." : "Reiniciar torneo"}
            </Button>
          </div>

          {activeSeason && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSavePlayoffs();
              }}
              className="mt-4 flex flex-col gap-4 border-t border-border pt-4"
            >
              <div className="w-56">
                <Field label="Mínimo de partidos para liguilla">
                  <Input
                    type="number"
                    min={1}
                    placeholder="Sin límite (regla desactivada)"
                    onKeyDown={blockNonIntegerKeys}
                    disabled={!isEditingPlayoffs}
                    value={minMatchesPlayoffs}
                    onChange={(e) => setMinMatchesPlayoffs(onlyDigits(e.target.value))}
                  />
                </Field>
              </div>
              <p className="text-xs text-muted">
                Partidos jugados que debe acumular un jugador desde su fecha de alta para ser elegible en liguilla.
                Vacío = la regla queda desactivada.
              </p>
              <EditFormFooter
                isEditing={isEditingPlayoffs}
                isDirty={isDirtyPlayoffs}
                submitting={updateSeason.isPending}
                onEdit={() => setIsEditingPlayoffs(true)}
                onCancel={handleCancelPlayoffs}
                editLabel="Editar mínimo de liguilla"
                submitLabel="Guardar mínimo"
              />
            </form>
          )}
        </CardBody>
      </Card>

      {me && <MyProfileForm userId={me.id} />}
      {me && <AdminUsersTable currentUserId={me.id} />}

      {dialog}
    </div>
  );
}
