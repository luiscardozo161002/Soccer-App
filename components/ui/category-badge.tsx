import {
  CATEGORY_BADGE_CLASSES,
  CATEGORY_DOT_CLASSES,
  categoryLabel,
  categoryShort,
  type LeagueCategoryValue,
} from "@/lib/constants/league-categories";

export function CategoryBadge({ category, className = "" }: { category: LeagueCategoryValue; className?: string }) {
  return (
    <span
      className={`inline-block max-w-full truncate rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_BADGE_CLASSES[category]} ${className}`}
    >
      {categoryLabel(category)}
    </span>
  );
}

export function CategoryDot({ category, className = "" }: { category: LeagueCategoryValue; className?: string }) {
  return (
    <span
      title={categoryLabel(category)}
      aria-label={categoryLabel(category)}
      className={`inline-flex h-2 w-2 shrink-0 rounded-full ${CATEGORY_DOT_CLASSES[category]} ${className}`}
    />
  );
}

export function CategoryTag({ category, className = "" }: { category: LeagueCategoryValue; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${CATEGORY_BADGE_CLASSES[category]} ${className}`}
    >
      {categoryShort(category)}
    </span>
  );
}
