import { API_ROUTES } from "@/lib/http/api-routes";
import { get, patch, post } from "@/lib/http/endpoints";
import type { ItemResponse } from "@/lib/http/types";
import type { Season, UpdateSeasonInput } from "../season.types";

export const seasonApi = {
  list() {
    return get<ItemResponse<Season[]>>(API_ROUTES.seasons.list);
  },
  get(id: string) {
    return get<ItemResponse<Season>>(API_ROUTES.seasons.byId(id));
  },
  update({ id, ...input }: UpdateSeasonInput & { id: string }) {
    return patch<ItemResponse<Season>, UpdateSeasonInput>(API_ROUTES.seasons.byId(id), input);
  },
  resetTournament() {
    return post<ItemResponse<Season>, Record<string, never>>(API_ROUTES.tournament.reset, {});
  },
};
