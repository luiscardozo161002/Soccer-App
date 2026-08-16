import { ReactNode } from "react";

// Capped height + internal scroll: the table stays put on screen and only
// its rows scroll once there are more than fit, instead of pushing the
// whole page taller as more rows get added.
export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="scrollbar-modern max-h-[65vh] w-full overflow-auto">
      <table className="w-full min-w-max border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Thead({ children }: { children: ReactNode }) {
  return (
    <thead className="sticky top-0 z-10 border-b border-border bg-surface text-left text-[11px] font-bold uppercase tracking-wide text-muted">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({
  children,
  className = "",
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <th className={`px-3 py-2 first:pl-5 last:pr-5 ${className}`} title={title}>
      {children}
    </th>
  );
}

export function Tbody({ children }: { children: ReactNode }) {
  return (
    <tbody className="divide-y divide-border text-[13px] [&>tr]:[animation:fade-in-up_0.25s_ease] [&>tr]:transition-colors [&>tr]:hover:bg-primary-light/40">
      {children}
    </tbody>
  );
}

export function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <td className={`px-3 py-1.5 text-ink/80 first:pl-5 last:pr-5 ${className}`}>{children}</td>
  );
}

export function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-6 text-center text-sm text-muted">
        {message}
      </td>
    </tr>
  );
}
