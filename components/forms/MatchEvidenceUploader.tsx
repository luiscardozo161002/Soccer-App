"use client";

import { ChangeEvent, useRef } from "react";
import { toast } from "sonner";
import { Camera, RotateCcw, Trash2, Loader2 } from "lucide-react";
import { fileToDataUrl } from "@/components/ui/photo-input";
import {
  useMatchEvidence,
  useUploadMatchEvidence,
  useDeleteMatchEvidence,
  matchEvidencePhotoUrl,
  type MatchEvidence,
  type MatchEvidenceSlot,
} from "@/hooks/useMatchEvidence";

const MAX_FILE_BYTES = 8 * 1024 * 1024;

const SLOTS: { value: MatchEvidenceSlot; label: string }[] = [
  { value: "front", label: "Anverso" },
  { value: "back", label: "Reverso" },
];

function SlotTile({
  label,
  slot,
  item,
  onUpload,
  onDelete,
  uploading,
}: {
  label: string;
  slot: MatchEvidenceSlot;
  item: MatchEvidence | undefined;
  onUpload: (slot: MatchEvidenceSlot, dataUrl: string) => void;
  onDelete: (id: string) => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      toast.error("La imagen no debe superar 8MB");
      return;
    }
    onUpload(slot, await fileToDataUrl(file));
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-ink/90">{label}</span>
      <div className="group relative aspect-square w-full max-w-40 overflow-hidden rounded-xl border border-border bg-primary-light/20">
        {item ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={matchEvidencePhotoUrl(item)} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                aria-label={`Volver a tomar foto — ${label}`}
                title="Volver a tomar"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
              </button>
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                aria-label={`Quitar foto — ${label}`}
                title="Quitar"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-red-600 transition-colors hover:bg-white"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-full w-full flex-col items-center justify-center gap-1.5 p-1 text-muted transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? <Loader2 size={22} className="animate-spin" /> : <Camera size={22} />}
            <span className="text-[11px] font-semibold">Tomar foto</span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          // Rear camera: these are proof photos (cédula arbitral), not
          // selfies — without `capture`, most mobile browsers skip the
          // camera option and go straight to the file/gallery picker.
          capture="environment"
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </div>
  );
}

// Exactly two fixed, labeled slots (anverso/reverso de la cédula arbitral),
// not an open gallery — uploading again to a filled slot retakes it. The
// register-result-form gates its confirm button on both slots being filled.
export function MatchEvidenceUploader({ matchId }: { matchId: string }) {
  const { data, isLoading } = useMatchEvidence(matchId);
  const evidenceBySlot = new Map((data?.data ?? []).map((item) => [item.slot, item]));
  const upload = useUploadMatchEvidence(matchId);
  const deleteEvidence = useDeleteMatchEvidence(matchId);

  const handleUpload = (slot: MatchEvidenceSlot, photo: string) => {
    upload.mutate(
      { slot, photo },
      { onError: () => toast.error("No se pudo subir la foto") }
    );
  };

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4">
      <p className="text-sm font-bold text-ink">Evidencia fotográfica — cédula arbitral</p>
      {isLoading ? (
        <p className="text-xs text-muted">Cargando fotos...</p>
      ) : (
        <div className="flex flex-wrap gap-4">
          {SLOTS.map(({ value, label }) => (
            <SlotTile
              key={value}
              slot={value}
              label={label}
              item={evidenceBySlot.get(value)}
              onUpload={handleUpload}
              onDelete={(id) => deleteEvidence.mutate(id)}
              uploading={upload.isPending}
            />
          ))}
        </div>
      )}
      <p className="text-xs text-muted">Sube el anverso y el reverso antes de guardar el resultado.</p>
    </div>
  );
}
