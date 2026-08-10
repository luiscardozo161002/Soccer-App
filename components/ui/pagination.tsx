import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ListMeta } from "@/lib/http/types";

export function Pagination({
  meta,
  onPageChange,
}: {
  meta: ListMeta | undefined;
  onPageChange: (page: number) => void;
}) {
  if (!meta || meta.totalItems === 0) return null;

  const from = (meta.page - 1) * meta.pageSize + 1;
  const to = Math.min(meta.page * meta.pageSize, meta.totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 text-sm">
      <p className="text-muted">
        Mostrando <span className="font-semibold text-ink">{from}-{to}</span> de{" "}
        <span className="font-semibold text-ink">{meta.totalItems}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
          aria-label="Página anterior"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-slate-100 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
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
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-slate-100 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
