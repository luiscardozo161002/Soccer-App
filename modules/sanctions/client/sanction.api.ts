import { API_ROUTES } from "@/lib/http/api-routes";
import { get, patch, post } from "@/lib/http/endpoints";
import type { ItemResponse, ListResponse } from "@/lib/http/types";
import type { CreateSanctionDto } from "../sanction.schema";
import type { CreateSanctionInput, Sanction, SanctionFilters } from "../sanction.types";

export function buildSanctionQueryString(filters: SanctionFilters) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    pageSize: String(filters.pageSize ?? 20),
  });
  if (filters.fulfilled !== undefined) params.set("fulfilled", String(filters.fulfilled));
  if (filters.category) params.set("category", filters.category);
  if (filters.search) params.set("search", filters.search);
  return params.toString();
}

export const sanctionApi = {
  list(filters: SanctionFilters) {
    return get<ListResponse<Sanction>>(`${API_ROUTES.sanctions.list}?${buildSanctionQueryString(filters)}`);
  },
  create({ cardId, ...input }: CreateSanctionInput) {
    return post<ItemResponse<Sanction>, CreateSanctionDto>(API_ROUTES.cards.sanctions(cardId), input);
  },
  pay(id: string) {
    return post<ItemResponse<Sanction>, Record<string, never>>(API_ROUTES.sanctions.pay(id), {});
  },
  revert(id: string) {
    return patch<ItemResponse<Sanction>, { fulfilled: boolean; waivedByPayment: boolean }>(
      API_ROUTES.sanctions.byId(id),
      { fulfilled: false, waivedByPayment: false }
    );
  },
};
