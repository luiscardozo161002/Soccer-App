"use client";

import { ChangeEvent, useRef } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const MAX_FILE_BYTES = 8 * 1024 * 1024;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function PhotoInput({
  value,
  onChange,
  onRemove,
  label = "Foto (opcional)",
  disabled = false,
  uploading = false,
}: {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  onRemove?: () => void;
  label?: string;
  disabled?: boolean;
  uploading?: boolean;
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

    const dataUrl = await fileToDataUrl(file);
    onChange(dataUrl);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-ink/90">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-primary-light/40 text-muted transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-border disabled:hover:text-muted"
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus size={20} />
          )}
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
              <Loader2 size={20} className="animate-spin text-white" />
            </span>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={handleFile}
          disabled={disabled}
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={() => (onRemove ? onRemove() : onChange(undefined))}
            className="flex items-center gap-1 text-xs font-semibold text-muted hover:text-red-500"
          >
            <X size={14} /> Quitar
          </button>
        )}
      </div>
    </div>
  );
}
