import type { Role } from "@/lib/auth/roles";
import type { EntityStatus } from "@/modules/teams/team.types";
import type { CreateUserDto, UpdateUserDto } from "./user.schema";

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  phoneNumber: string | null;
  photoType: string | null;
  photoUpdatedAt: string | null;
  role: Role;
  status: EntityStatus;
  createdAt: string;
}

export type CreateUserInput = CreateUserDto;
export type UpdateUserInput = UpdateUserDto;

export interface UserFilters {
  page?: number;
  pageSize?: number;
  role?: Role;
}
