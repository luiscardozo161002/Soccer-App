import { ReactNode } from "react";

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Thead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
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
    <th className={`px-4 py-3 first:pl-6 last:pr-6 ${className}`} title={title}>
      {children}
    </th>
  );
}

export function Tbody({ children }: { children: ReactNode }) {
  return (
    <tbody className="divide-y divide-slate-100 [&>tr]:transition-colors [&>tr]:hover:bg-primary-light/40">
      {children}
    </tbody>
  );
}

export function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <td className={`px-4 py-3 text-slate-700 first:pl-6 last:pr-6 ${className}`}>{children}</td>
  );
}

export function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-10 text-center text-sm text-slate-400">
        {message}
      </td>
    </tr>
  );
}
