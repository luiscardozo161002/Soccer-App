"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUpdateSettings, siteLogoUrl, type SiteSettings } from "@/hooks/useSettings";
import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import { ApiError } from "@/lib/errors";
import { onlyHexColor } from "@/lib/utils/forms";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { PhotoInput } from "@/components/ui/photo-input";

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 shrink-0 cursor-pointer rounded-lg border border-border bg-surface p-1"
        />
        <Input
          value={value}
          onChange={(e) => onChange(onlyHexColor(e.target.value))}
          maxLength={7}
          className="uppercase"
        />
      </div>
    </Field>
  );
}

export function BrandingForm({ settings }: { settings: SiteSettings }) {
  const updateSettings = useUpdateSettings();
  const [name, setName] = useState("");
  const [slogan, setSlogan] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#0d9488");
  const [backgroundColor, setBackgroundColor] = useState("#eef3f1");
  const [logo, setLogo] = useState<string | undefined>(undefined);

  useEffect(() => {
    setName(settings.name);
    setSlogan(settings.slogan ?? "");
    setPrimaryColor(settings.primaryColor);
    setBackgroundColor(settings.backgroundColor);
  }, [settings]);

  const isDirty =
    name !== settings.name ||
    slogan !== (settings.slogan ?? "") ||
    primaryColor !== settings.primaryColor ||
    backgroundColor !== settings.backgroundColor ||
    !!logo;
  const dismissUnsavedWarning = useUnsavedChangesWarning(isDirty);

  const handleSaveBranding = () => {
    updateSettings.mutate(
      { name, slogan },
      {
        onSuccess: () => {
          toast.success("Nombre actualizado");
          dismissUnsavedWarning();
          window.location.reload();
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "No se pudo actualizar el nombre"),
      }
    );
  };

  const handleSaveLogo = () => {
    if (!logo) return;
    updateSettings.mutate(
      { logo },
      {
        onSuccess: () => {
          toast.success("Logo actualizado");
          setLogo(undefined);
          dismissUnsavedWarning();
          window.location.reload();
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "No se pudo actualizar el logo"),
      }
    );
  };

  const handleSaveColors = () => {
    updateSettings.mutate(
      { primaryColor, backgroundColor },
      {
        onSuccess: () => {
          toast.success("Colores actualizados");
          dismissUnsavedWarning();
          window.location.reload();
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "No se pudieron actualizar los colores"),
      }
    );
  };

  return (
    <>
      <Card>
        <CardHeader title="Nombre y eslogan" description="Se muestran en el menú del admin y en el sitio público." />
        <CardBody>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="w-72">
                <Field label="Nombre">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Liga de Futbol"
                    maxLength={80}
                  />
                </Field>
              </div>
              <div className="w-full sm:w-96">
                <Field label="Eslogan (opcional)">
                  <Input
                    value={slogan}
                    onChange={(e) => setSlogan(e.target.value)}
                    placeholder="¡Di no a la violencia, sí a la sana convivencia!"
                    maxLength={200}
                  />
                </Field>
              </div>
            </div>
            <div>
              <Button onClick={handleSaveBranding} disabled={updateSettings.isPending || !name.trim()}>
                Guardar nombre
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Logo" description="Se usa en el menú del admin y el sitio público." />
        <CardBody>
          <div className="flex flex-wrap items-end gap-4">
            <PhotoInput
              value={logo ?? siteLogoUrl(settings) ?? undefined}
              onChange={setLogo}
              label="Logo"
              uploading={updateSettings.isPending}
            />
            <Button onClick={handleSaveLogo} disabled={updateSettings.isPending || !logo}>
              Guardar logo
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Colores del tema"
          description="Color de botones/acentos y color de fondo del panel de administración."
        />
        <CardBody>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ColorField label="Color de botones (acento)" value={primaryColor} onChange={setPrimaryColor} />
              <ColorField label="Color de fondo" value={backgroundColor} onChange={setBackgroundColor} />
            </div>
            <p className="text-xs text-muted">
              Estos colores aplican al panel de administración y al sitio público.
            </p>
            <div>
              <Button onClick={handleSaveColors} disabled={updateSettings.isPending}>
                Guardar colores
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </>
  );
}
