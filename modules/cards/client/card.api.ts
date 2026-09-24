import { API_ROUTES } from "@/lib/http/api-routes";
import { get, patch, post, remove } from "@/lib/http/endpoints";
import type { ItemResponse, ListResponse } from "@/lib/http/types";
import type {
  CardFilters,
  CardReasonConfig,
  CardReasonConfigFilters,
  CreateCardInput,
  CreateCardReasonConfigInput,
  MatchCard,
  UpdateCardReasonConfigInput,
} from "../card.types";

export function buildCardQueryString(filters: CardFilters) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    pageSize: String(filters.pageSize ?? 100),
  });
  if (filters.matchId) params.set("matchId", filters.matchId);
  if (filters.playerId) params.set("playerId", filters.playerId);
  if (filters.type) params.set("type", filters.type);
  if (filters.paid !== undefined) params.set("paid", String(filters.paid));
  if (filters.category) params.set("category", filters.category);
  if (filters.search) params.set("search", filters.search);
  return params.toString();
}

export function buildCardReasonQueryString(filters: CardReasonConfigFilters) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    pageSize: String(filters.pageSize ?? 100),
  });
  if (filters.cardType) params.set("cardType", filters.cardType);
  if (filters.active !== undefined) params.set("active", String(filters.active));
  return params.toString();
}

export const cardApi = {
  list(filters: CardFilters) {
    return get<ListResponse<MatchCard>>(`${API_ROUTES.cards.list}?${buildCardQueryString(filters)}`);
  },
  create(input: CreateCardInput) {
    return post<ItemResponse<MatchCard>, CreateCardInput>(API_ROUTES.cards.list, input);
  },
  remove(id: string) {
    return remove<void>(API_ROUTES.cards.byId(id));
  },
  pay(id: string) {
    return post<ItemResponse<MatchCard>, Record<string, never>>(API_ROUTES.cards.pay(id), {});
  },
  revertPayment(id: string) {
    return patch<ItemResponse<MatchCard>, { paid: boolean }>(API_ROUTES.cards.byId(id), { paid: false });
  },
};

export const cardReasonConfigApi = {
  list(filters: CardReasonConfigFilters) {
    return get<ListResponse<CardReasonConfig>>(
      `${API_ROUTES.cardReasonConfigs.list}?${buildCardReasonQueryString(filters)}`
    );
  },
  create(input: CreateCardReasonConfigInput) {
    return post<ItemResponse<CardReasonConfig>, CreateCardReasonConfigInput>(API_ROUTES.cardReasonConfigs.list, input);
  },
  update({ id, ...input }: UpdateCardReasonConfigInput & { id: string }) {
    return patch<ItemResponse<CardReasonConfig>, UpdateCardReasonConfigInput>(
      API_ROUTES.cardReasonConfigs.byId(id),
      input
    );
  },
};
