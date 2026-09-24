import type { Sanction } from "./sanction.types";

export function sanctionMatchesRemaining(sanction: Sanction) {
  return Math.max(0, sanction.matchesSuspended - sanction._count.appliedMatches);
}

export function activeSanctionsByPlayer(sanctions: Sanction[]) {
  const sanctionsByPlayer = new Map<string, Sanction[]>();
  for (const sanction of sanctions) {
    if (!sanction.fulfilled) {
      const playerSanctions = sanctionsByPlayer.get(sanction.card.player.id) ?? [];
      playerSanctions.push(sanction);
      sanctionsByPlayer.set(sanction.card.player.id, playerSanctions);
    }
  }
  return sanctionsByPlayer;
}
