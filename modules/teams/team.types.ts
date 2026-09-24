import type { LeagueCategoryValue } from "@/lib/constants/league-categories";
import type { CreateTeamDto, UpdateTeamDto } from "./team.schema";

export type EntityStatus = "active" | "inactive";

export interface Team {
  id: string;
  name: string;
  photoType: string | null;
  photoUpdatedAt: string | null;
  registeredAt: string;
  category: LeagueCategoryValue;
  status: EntityStatus;
  folioPrefix: string | null;
}

export type CreateTeamInput = CreateTeamDto;
export type UpdateTeamInput = UpdateTeamDto;

export interface TeamFilters {
  page?: number;
  pageSize?: number;
  category?: LeagueCategoryValue;
}
