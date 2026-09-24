import { API_ROUTES } from "@/lib/http/api-routes";
import { get, patch, post, remove } from "@/lib/http/endpoints";
import type { ItemResponse, ListResponse } from "@/lib/http/types";
import type { AdminUser, CreateUserInput, UpdateUserInput, UserFilters } from "../user.types";

export function adminPhotoUrl(user: Pick<AdminUser, "id" | "photoType" | "photoUpdatedAt">) {
  if (!user.photoType) return null;
  const version = user.photoUpdatedAt ? new Date(user.photoUpdatedAt).getTime() : 0;
  return `${API_ROUTES.users.photo(user.id)}?v=${version}`;
}

export function buildUserQueryString(filters: UserFilters) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    pageSize: String(filters.pageSize ?? 100),
  });
  if (filters.role) params.set("role", filters.role);
  return params.toString();
}

export const userApi = {
  list(filters: UserFilters) {
    return get<ListResponse<AdminUser>>(`${API_ROUTES.users.list}?${buildUserQueryString(filters)}`);
  },
  create(input: CreateUserInput) {
    return post<ItemResponse<AdminUser>, CreateUserInput>(API_ROUTES.users.list, input);
  },
  update({ id, ...input }: UpdateUserInput & { id: string }) {
    return patch<ItemResponse<AdminUser>, UpdateUserInput>(API_ROUTES.users.byId(id), input);
  },
  remove(id: string) {
    return remove<void>(API_ROUTES.users.byId(id));
  },
};
