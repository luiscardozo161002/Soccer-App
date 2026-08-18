"use client";

import Link from "next/link";
import { toast } from "sonner";
import { History, RotateCcw } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useResetTournament } from "@/hooks/useTournament";
import { useMe } from "@/hooks/useAuth";
import { ApiError } from "@/lib/errors";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
        </CardBody>
      </Card>

      {me && <MyProfileForm userId={me.id} />}
      {me && <AdminUsersTable currentUserId={me.id} />}

      {dialog}
    </div>
  );
}
