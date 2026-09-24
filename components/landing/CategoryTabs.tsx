import { LEAGUE_CATEGORIES } from "@/lib/constants/league-categories";

export function CategoryTabs({
  activeIndex,
  onChange,
}: {
  activeIndex: number;
  onChange: (index: number) => void;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {LEAGUE_CATEGORIES.map((c, i) => (
        <button
          key={c.value}
          type="button"
          onClick={() => onChange(i)}
          aria-current={i === activeIndex}
          className={`rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${i === activeIndex
            ? "border-primary bg-primary text-white"
            : "border-border text-muted hover:border-primary hover:text-primary dark:border-white/15 dark:text-white/60"
            }`}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
