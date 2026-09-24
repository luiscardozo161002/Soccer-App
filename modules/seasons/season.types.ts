import type { UpdateSeasonDto } from "./season.schema";

export type SeasonStatus = "active" | "archived";

export interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string | null;
  status: SeasonStatus;
}

export type UpdateSeasonInput = UpdateSeasonDto;
