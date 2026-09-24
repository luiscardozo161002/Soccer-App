import type { EntityStatus } from "@/modules/teams/team.types";
import type { CreateFieldDto, UpdateFieldDto } from "./field.schema";

export interface Field {
  id: string;
  name: string;
  location: string | null;
  status: EntityStatus;
}

export type CreateFieldInput = CreateFieldDto;
export type UpdateFieldInput = UpdateFieldDto;

export interface FieldFilters {
  page?: number;
  pageSize?: number;
}
