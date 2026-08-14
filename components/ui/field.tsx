import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

const controlClasses =
  "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:opacity-60";

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-ink/90">{label}</span>
      {children}
      {error && <span className="text-xs font-medium text-red-500">{error}</span>}
    </label>
  );
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${controlClasses} ${className}`} {...props} />;
}

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${controlClasses} ${className}`} {...props} />;
}
