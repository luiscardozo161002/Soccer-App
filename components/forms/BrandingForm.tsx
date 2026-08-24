"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUpdateSettings, siteLogoUrl, type SiteSettings } from "@/hooks/useSettings";
import {
  useUnsavedChangesWarning,
  suppressUnsavedChangesWarningOnce,
  resumeUnsavedChangesWarning,
} from "@/hooks/useUnsavedChangesWarning";
import { ApiError } from "@/lib/errors";
import { onlyHexColor } from "@/lib/utils/forms";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { PhotoInput } from "@/components/ui/photo-input";
import { EditFormFooter } from "@/components/ui/edit-form-footer";

function ColorField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-10 w-14 shrink-0 cursor-pointer rounded-lg border border-border bg-surface p-1 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <Input
          value={value}
          onChange={(e) => onChange(onlyHexColor(e.target.value))}
          disabled={disabled}
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
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingLogo, setIsEditingLogo] = useState(false);
  const [isEditingColors, setIsEditingColors] = useState(false);

  useEffect(() => {
    setName(settings.name);
    setSlogan(settings.slogan ?? "");
    setPrimaryColor(settings.primaryColor);
    setBackgroundColor(settings.backgroundColor);
    setLogo(undefined);
    setLogoRemoved(false);
    setIsEditingName(false);
    setIsEditingLogo(false);
    setIsEditingColors(false);
  }, [settings]);

  const isDirtyName = name !== settings.name || slogan !== (settings.slogan ?? "");
  const isDirtyLogo = !!logo || logoRemoved;
  const isDirtyColors =
    primaryColor.toLowerCase() !== settings.primaryColor.toLowerCase() ||
    backgroundColor.toLowerCase() !== settings.backgroundColor.toLowerCase();

  // Each section only arms the native "leave site?" prompt while it's the
  // one actively being edited with unsaved changes — not just because a
  // field somewhere on the page differs from what's saved.
  useUnsavedChangesWarning(isEditingName && isDirtyName);
  useUnsavedChangesWarning(isEditingLogo && isDirtyLogo);
  useUnsavedChangesWarning(isEditingColors && isDirtyColors);

  const handleCancelName = () => {
    setName(settings.name);
    setSlogan(settings.slogan ?? "");
    setIsEditingName(false);
  };

  const handleCancelLogo = () => {
    setLogo(undefined);
    setLogoRemoved(false);
    setIsEditingLogo(false);
  };

  const handleCancelColors = () => {
    setPrimaryColor(settings.primaryColor);
    setBackgroundColor(settings.backgroundColor);
    setIsEditingColors(false);
  };

  const handleSaveBranding = () => {
    // Suppressed from the moment the save starts, not just on success — a
    // dev-mode Fast Refresh reload landing while the request is still in
    // flight was still tripping the native "leave site?" prompt otherwise.
    // Released again once the request settles either way, so it never
    // outlives this one save.
    suppressUnsavedChangesWarningOnce();
    updateSettings.mutate(
      { name, slogan },
      {
        onSuccess: () => {
          toast.success("Nombre actualizado");
          window.location.reload();
        },
        onError: (error) => {
          resumeUnsavedChangesWarning();
          toast.error(error instanceof ApiError ? error.message : "No se pudo actualizar el nombre");
        },
      }
    );
  };

  const handleSaveLogo = () => {
    if (!isDirtyLogo) return;
    suppressUnsavedChangesWarningOnce();
    updateSettings.mutate(
      { logo: logoRemoved ? null : logo },
      {
        onSuccess: () => {
          toast.success(logoRemoved ? "Logo eliminado" : "Logo actualizado");
          window.location.reload();
        },
        onError: (error) => {
          resumeUnsavedChangesWarning();
          toast.error(error instanceof ApiError ? error.message : "No se pudo actualizar el logo");
        },
      }
    );
  };

  const handleSaveColors = () => {
    suppressUnsavedChangesWarningOnce();
    updateSettings.mutate(
      { primaryColor, backgroundColor },
      {
        onSuccess: () => {
          toast.success("Colores actualizados");
          window.location.reload();
        },
        onError: (error) => {
          resumeUnsavedChangesWarning();
          toast.error(error instanceof ApiError ? error.message : "No se pudieron actualizar los colores");
        },
      }
    );
  };

  return (
    <>
      <Card>
        <CardHeader title="Nombre y eslogan" description="Se muestran en el menú del admin y en el sitio público." />
        <CardBody>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveBranding();
            }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-wrap items-end gap-4">
              <div className="w-72">
                <Field label="Nombre">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Liga de Futbol"
                    maxLength={80}
                    disabled={!isEditingName}
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
                    disabled={!isEditingName}
                  />
                </Field>
              </div>
            </div>
            <EditFormFooter
              isEditing={isEditingName}
              isDirty={isDirtyName && !!name.trim()}
              submitting={updateSettings.isPending}
              onEdit={() => setIsEditingName(true)}
              onCancel={handleCancelName}
              editLabel="Editar nombre y eslogan"
              submitLabel="Guardar nombre"
            />
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Logo" description="Se usa en el menú del admin y el sitio público." />
        <CardBody>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveLogo();
            }}
            className="flex flex-col gap-4"
          >
            <PhotoInput
              value={logoRemoved ? undefined : logo ?? siteLogoUrl(settings) ?? undefined}
              onChange={(dataUrl) => {
                setLogo(dataUrl);
                setLogoRemoved(false);
              }}
              onRemove={() => {
                setLogo(undefined);
                setLogoRemoved(true);
              }}
              label="Logo"
              disabled={!isEditingLogo}
              uploading={updateSettings.isPending}
            />
            <EditFormFooter
              isEditing={isEditingLogo}
              isDirty={isDirtyLogo}
              submitting={updateSettings.isPending}
              onEdit={() => setIsEditingLogo(true)}
              onCancel={handleCancelLogo}
              editLabel="Editar logo"
              submitLabel="Guardar logo"
            />
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Colores del tema"
          description="Color de botones/acentos y color de fondo del panel de administración."
        />
        <CardBody>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveColors();
            }}
            className="flex flex-col gap-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ColorField
                label="Color de botones (acento)"
                value={primaryColor}
                onChange={setPrimaryColor}
                disabled={!isEditingColors}
              />
              <ColorField
                label="Color de fondo"
                value={backgroundColor}
                onChange={setBackgroundColor}
                disabled={!isEditingColors}
              />
            </div>
            <p className="text-xs text-muted">
              Estos colores aplican al panel de administración y al sitio público.
            </p>
            <EditFormFooter
              isEditing={isEditingColors}
              isDirty={isDirtyColors}
              submitting={updateSettings.isPending}
              onEdit={() => setIsEditingColors(true)}
              onCancel={handleCancelColors}
              editLabel="Editar colores"
              submitLabel="Guardar colores"
            />
          </form>
        </CardBody>
      </Card>
    </>
  );
}
