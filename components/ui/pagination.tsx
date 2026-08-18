import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ListMeta } from "@/lib/http/types";

export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];
export const DEFAULT_PAGE_SIZE: PageSize = 20;

export function Pagination({
  meta,
  onPageChange,
  onPageSizeChange,
}: {
  meta: ListMeta | undefined;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: PageSize) => void;
}) {
  if (!meta || meta.totalItems === 0) return null;

  const from = (meta.page - 1) * meta.pageSize + 1;
  const to = Math.min(meta.page * meta.pageSize, meta.totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4 text-sm">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-muted">
          Mostrando <span className="font-semibold text-ink">{from}-{to}</span> de{" "}
          <span className="font-semibold text-ink">{meta.totalItems}</span>
        </p>
        {onPageSizeChange && (
          <label className="flex items-center gap-1.5 text-xs text-muted">
            Por página
            <select
              value={meta.pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value) as PageSize)}
              className="rounded-lg border border-border bg-surface px-1.5 py-1 text-xs text-ink outline-none focus:border-primary"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
          aria-label="Página anterior"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary-light hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="min-w-16 text-center font-semibold text-ink">
          {meta.page} / {meta.totalPages}
        </span>
        <button
          type="button"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPageChange(meta.page + 1)}
          aria-label="Página siguiente"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary-light hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
