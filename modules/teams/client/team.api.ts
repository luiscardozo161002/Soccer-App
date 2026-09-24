import { API_ROUTES } from "@/lib/http/api-routes";
import { get, patch, post, remove } from "@/lib/http/endpoints";
import type { ItemResponse, ListResponse } from "@/lib/http/types";
import type { CreateTeamInput, Team, TeamFilters, UpdateTeamInput } from "../team.types";

export function buildTeamQueryString(filters: TeamFilters) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    pageSize: String(filters.pageSize ?? 100),
  });
  if (filters.category) params.set("category", filters.category);
  return params.toString();
}

export function teamPhotoUrl(team: Pick<Team, "id" | "photoType" | "photoUpdatedAt">) {
  if (!team.photoType) return null;
  const version = team.photoUpdatedAt ? new Date(team.photoUpdatedAt).getTime() : 0;
  return `${API_ROUTES.teams.photo(team.id)}?v=${version}`;
}

export const teamApi = {
  list(filters: TeamFilters) {
    return get<ListResponse<Team>>(`${API_ROUTES.teams.list}?${buildTeamQueryString(filters)}`);
  },
  create(input: CreateTeamInput) {
    return post<ItemResponse<Team>, CreateTeamInput>(API_ROUTES.teams.list, input);
  },
  update({ id, ...input }: UpdateTeamInput & { id: string }) {
    return patch<ItemResponse<Team>, UpdateTeamInput>(API_ROUTES.teams.byId(id), input);
  },
  remove(id: string) {
    return remove<void>(API_ROUTES.teams.byId(id));
  },
};
