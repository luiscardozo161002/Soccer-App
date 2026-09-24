import type { LeagueCategoryValue } from "@/lib/constants/league-categories";
import type { EntityStatus } from "@/modules/teams/team.types";
import type { CreatePlayerDto, UpdatePlayerDto } from "./player.schema";

export interface Player {
  id: string;
  teamId: string;
  name: string;
  photoType: string | null;
  photoUpdatedAt: string | null;
  birthDate: string | null;
  registrationNumber: string;
  status: EntityStatus;
}

export type CreatePlayerInput = Omit<CreatePlayerDto, "birthDate"> & { birthDate?: string };
export type UpdatePlayerInput = Omit<UpdatePlayerDto, "birthDate"> & { birthDate?: string };

export interface PlayerFilters {
  teamId?: string;
  category?: LeagueCategoryValue;
  page?: number;
  pageSize?: number;
}
