const colors: Record<string, string> = {
  active: "bg-primary-light text-primary",
  inactive: "bg-slate-100 text-slate-500",
  scheduled: "bg-blue-50 text-blue-600",
  played: "bg-primary-light text-primary",
  postponed: "bg-amber-50 text-amber-700",
  cancelled: "bg-red-50 text-red-600",
  yellow: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-700",
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
