"use client";

import { Modal } from "@/components/ui/modal";

export interface PlayerPhotoModalTarget {
  name: string;
  photoUrl: string | null;
}

// Shared lightbox for "click a player's avatar/name to see it large" —
// used from the Jugadores table and from Sanciones so both stay consistent.
export function PlayerPhotoModal({ player, onClose }: { player: PlayerPhotoModalTarget | null; onClose: () => void }) {
  const initials = player?.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <Modal open={!!player} onClose={onClose} title={player?.name ?? ""}>
      <div className="flex flex-col items-center gap-3 py-2">
        {player?.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={player.photoUrl}
            alt={player.name}
            className="h-56 w-56 rounded-full border-4 border-primary-light object-contain"
          />
        ) : (
          <div className="flex h-56 w-56 items-center justify-center rounded-full bg-primary/10 text-5xl font-bold text-primary">
            {initials || "?"}
          </div>
        )}
        <p className="text-lg font-bold text-ink">{player?.name}</p>
      </div>
    </Modal>
  );
}
