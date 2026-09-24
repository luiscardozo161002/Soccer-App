import { API_ROUTES } from "@/lib/http/api-routes";
import { get, patch, post } from "@/lib/http/endpoints";
import type { ItemResponse, ListResponse } from "@/lib/http/types";
import type {
  CreateMatchInput,
  Match,
  MatchFilters,
  RegisterResultInput,
  UpdateMatchInput,
} from "../match.types";

export function buildMatchQueryString(filters: MatchFilters) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    pageSize: String(filters.pageSize ?? 100),
  });

  if (filters.matchday) params.set("matchday", String(filters.matchday));
  if (filters.teamId) params.set("teamId", filters.teamId);
  if (filters.status) params.set("status", filters.status);
  if (filters.category) params.set("category", filters.category);
  if (filters.refereeId) params.set("refereeId", filters.refereeId);

  return params.toString();
}

export const matchApi = {
  list(filters: MatchFilters) {
    return get<ListResponse<Match>>(`${API_ROUTES.matches.list}?${buildMatchQueryString(filters)}`);
  },

  latestMatchday() {
    return get<ItemResponse<{ matchday: number; date: string } | null>>(API_ROUTES.matches.latestMatchday);
  },

  create(input: CreateMatchInput) {
    return post<ItemResponse<Match>, CreateMatchInput>(API_ROUTES.matches.list, input);
  },

  update({ id, ...input }: UpdateMatchInput & { id: string }) {
    return patch<ItemResponse<Match>, UpdateMatchInput>(API_ROUTES.matches.byId(id), input);
  },

  registerResult({ id, ...input }: RegisterResultInput & { id: string }) {
    return patch<ItemResponse<Match>, RegisterResultInput>(API_ROUTES.matches.result(id), input);
  },
};
