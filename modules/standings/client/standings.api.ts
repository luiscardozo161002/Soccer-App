import { API_ROUTES } from "@/lib/http/api-routes";
import { get } from "@/lib/http/endpoints";
import type { ItemResponse } from "@/lib/http/types";
import type { StandingsRow } from "../standings.types";

export const standingsApi = {
  list(seasonId?: string) {
    const url = seasonId
      ? `${API_ROUTES.standings.list}?${new URLSearchParams({ seasonId })}`
      : API_ROUTES.standings.list;
    return get<ItemResponse<StandingsRow[]>>(url);
  },
};
