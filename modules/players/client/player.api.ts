import { API_ROUTES } from "@/lib/http/api-routes";
import { get, patch, post, remove } from "@/lib/http/endpoints";
import type { ItemResponse, ListResponse } from "@/lib/http/types";
import type { CreatePlayerInput, Player, PlayerFilters, UpdatePlayerInput } from "../player.types";

export function buildPlayerQueryString(filters: PlayerFilters) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    pageSize: String(filters.pageSize ?? 100),
  });
  if (filters.teamId) params.set("teamId", filters.teamId);
  if (filters.category) params.set("category", filters.category);
  return params.toString();
}

export function playerPhotoUrl(player: Pick<Player, "id" | "photoType" | "photoUpdatedAt">) {
  if (!player.photoType) return null;
  const version = player.photoUpdatedAt ? new Date(player.photoUpdatedAt).getTime() : 0;
  return `${API_ROUTES.players.photo(player.id)}?v=${version}`;
}

export const playerApi = {
  list(filters: PlayerFilters) {
    return get<ListResponse<Player>>(`${API_ROUTES.players.list}?${buildPlayerQueryString(filters)}`);
  },
  create(input: CreatePlayerInput) {
    return post<ItemResponse<Player>, CreatePlayerInput>(API_ROUTES.players.list, input);
  },
  update({ id, ...input }: UpdatePlayerInput & { id: string }) {
    return patch<ItemResponse<Player>, UpdatePlayerInput>(API_ROUTES.players.byId(id), input);
  },
  remove(id: string) {
    return remove<void>(API_ROUTES.players.byId(id));
  },
};
