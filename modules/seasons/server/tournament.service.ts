import { seasonRepository } from "./season.repository";
import { seasonService } from "./season.service";

async function nextSeasonName() {
  const baseName = `Liga ${new Date().getFullYear()}`;
  let name = baseName;
  let attempt = 2;
  while (await seasonRepository.nameExists(name)) {
    name = `${baseName} (${attempt})`;
    attempt += 1;
  }
  return name;
}

export const tournamentService = {
  async reset() {
    const active = await seasonService.getActive();
    return seasonRepository.archiveAndCreate(active.id, await nextSeasonName());
  },
};
