export interface ListMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ListResponse<T> {
  success: true;
  data: T[];
  meta: ListMeta;
}

export interface ItemResponse<T> {
  success: true;
  data: T;
  message?: string;
}
