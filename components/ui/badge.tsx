const colors: Record<string, string> = {
  active: "bg-primary-light text-primary",
  inactive: "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/50",
  scheduled: "bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300",
  played: "bg-primary-light text-primary",
  postponed: "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
  cancelled: "bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-300",
  yellow: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200",
  red: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
};

export function Badge({ children, tone }: { children: string; tone: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[tone] ?? colors.inactive}`}
    >
      {children}
    </span>
  );
}
