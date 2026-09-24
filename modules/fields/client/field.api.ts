import { API_ROUTES } from "@/lib/http/api-routes";
import { get, patch, post, remove } from "@/lib/http/endpoints";
import type { ItemResponse, ListResponse } from "@/lib/http/types";
import type { CreateFieldInput, Field, FieldFilters, UpdateFieldInput } from "../field.types";

export function googleMapsUrl(location: string) {
  if (/^https?:\/\//i.test(location.trim())) return location.trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

export function buildFieldQueryString(filters: FieldFilters) {
  return new URLSearchParams({
    page: String(filters.page ?? 1),
    pageSize: String(filters.pageSize ?? 100),
  }).toString();
}

export const fieldApi = {
  list(filters: FieldFilters) {
    return get<ListResponse<Field>>(`${API_ROUTES.fields.list}?${buildFieldQueryString(filters)}`);
  },
  create(input: CreateFieldInput) {
    return post<ItemResponse<Field>, CreateFieldInput>(API_ROUTES.fields.list, input);
  },
  update({ id, ...input }: UpdateFieldInput & { id: string }) {
    return patch<ItemResponse<Field>, UpdateFieldInput>(API_ROUTES.fields.byId(id), input);
  },
  remove(id: string) {
    return remove<void>(API_ROUTES.fields.byId(id));
  },
};
