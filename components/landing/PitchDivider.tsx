export function PitchDivider() {
  return (
    <div className="relative mt-20 flex items-center gap-4" aria-hidden>
      <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
      <svg
        viewBox="0 0 40 40"
        className="h-8 w-8 shrink-0 text-slate-300 dark:text-white/10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        <circle cx="20" cy="20" r="14" />
        <circle cx="20" cy="20" r="1.4" fill="currentColor" stroke="none" />
      </svg>
      <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
    </div>
  );
}
