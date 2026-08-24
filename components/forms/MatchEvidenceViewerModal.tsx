"use client";

import { useState } from "react";
import { Download, X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { useMatchEvidence, matchEvidencePhotoUrl, type MatchEvidence } from "@/hooks/useMatchEvidence";
import { Modal } from "@/components/ui/modal";

export interface EvidenceViewerMatch {
  id: string;
  homeTeamName: string;
  awayTeamName: string;
  matchday: number;
}

const SLOT_LABELS: Record<MatchEvidence["slot"], string> = { front: "Anverso", back: "Reverso" };

const MIN_SCALE = 0.5;
const MAX_SCALE = 4;

function ZoomLightbox({ item, onClose }: { item: MatchEvidence; onClose: () => void }) {
  const [scale, setScale] = useState(1);
  const clamp = (n: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, n));

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/95">
      <div className="flex items-center justify-between gap-2 p-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setScale((s) => clamp(s - 0.25))}
            aria-label="Alejar"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ZoomOut size={18} />
          </button>
          <span className="w-12 text-center text-sm font-semibold text-white/80">{Math.round(scale * 100)}%</span>
          <button
            type="button"
            onClick={() => setScale((s) => clamp(s + 0.25))}
            aria-label="Acercar"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ZoomIn size={18} />
          </button>
          <button
            type="button"
            onClick={() => setScale(1)}
            aria-label="Restablecer zoom"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <RotateCcw size={16} />
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="mr-1 text-sm font-semibold text-white/80">{SLOT_LABELS[item.slot]}</span>
          <a
            href={matchEvidencePhotoUrl(item)}
            download
            aria-label="Descargar foto"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Download size={18} />
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      {/* overflow-auto instead of custom pan handlers: once scaled up past
          the viewport, the browser's native scroll/touch-drag already lets
          you get around the image. */}
      <div className="flex flex-1 items-center justify-center overflow-auto p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={matchEvidencePhotoUrl(item)}
          alt=""
          style={{ transform: `scale(${scale})` }}
          className="max-h-[80vh] max-w-[80vw] shrink-0 object-contain transition-transform duration-150"
        />
      </div>
    </div>
  );
}

// Read-only counterpart to MatchEvidenceUploader: same two labeled slots
// (anverso/reverso de la cédula arbitral), but each photo offers a download
// instead of a delete/retake — this is for viewing evidence after the
// result is already locked.
export function MatchEvidenceViewerModal({
  match,
  onClose,
}: {
  match: EvidenceViewerMatch | null;
  onClose: () => void;
}) {
  const { data, isLoading } = useMatchEvidence(match?.id ?? "");
  const evidence = data?.data ?? [];
  const [zoomItem, setZoomItem] = useState<MatchEvidence | null>(null);

  return (
    <>
      <Modal
        open={!!match}
        onClose={onClose}
        title="Evidencia fotográfica"
        description={match ? `${match.homeTeamName} vs ${match.awayTeamName} · Jornada ${match.matchday}` : undefined}
        size="sm"
      >
        {isLoading && <p className="text-sm text-muted">Cargando fotos...</p>}
        {!isLoading && evidence.length === 0 && (
          <p className="text-sm text-muted">Este partido no tiene evidencia fotográfica.</p>
        )}
        {evidence.length > 0 && (
          <div className="flex flex-wrap gap-4">
            {evidence.map((item) => (
              <div key={item.id} className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink/90">{SLOT_LABELS[item.slot]}</span>
                <div className="group relative h-40 w-40 shrink-0 overflow-hidden rounded-xl border border-border">
                  <button
                    type="button"
                    onClick={() => setZoomItem(item)}
                    aria-label={`Ver foto en grande — ${SLOT_LABELS[item.slot]}`}
                    className="block h-full w-full cursor-zoom-in"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={matchEvidencePhotoUrl(item)} alt="" className="h-full w-full object-cover" />
                  </button>
                  <a
                    href={matchEvidencePhotoUrl(item)}
                    download
                    aria-label={`Descargar foto — ${SLOT_LABELS[item.slot]}`}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Download size={16} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
      {zoomItem && <ZoomLightbox item={zoomItem} onClose={() => setZoomItem(null)} />}
    </>
  );
}
