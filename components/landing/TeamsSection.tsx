import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import type { Team } from "@/modules/teams/hooks/useTeams";
import { teamPhotoUrl } from "@/modules/teams/hooks/useTeams";
import { Avatar } from "@/components/ui/avatar";
import { CategoryBadge } from "@/components/ui/category-badge";
import type { LeagueCategory } from "@/lib/constants/league-categories";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { sectionReveal } from "@/lib/landing/animations";
import { CategoryTabs } from "@/components/landing/CategoryTabs";
import { JerseyGlyph } from "@/components/landing/icons";

export function TeamsSection({
  activeCategory,
  categoryIndex,
  onCategoryChange,
  categoryRoster,
}: {
  activeCategory: LeagueCategory;
  categoryIndex: number;
  onCategoryChange: (index: number) => void;
  categoryRoster: Team[];
}) {
  const { t } = useLocale();

  return (
    <motion.section id="equipos" className="relative mt-12 scroll-mt-24 overflow-hidden" {...sectionReveal}>
      <JerseyGlyph className="pointer-events-none absolute -right-6 -top-8 -z-10 h-44 w-44 text-ink/[0.035] dark:text-white/[0.04] sm:h-60 sm:w-60" />

      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-ink dark:text-white">{t.teams.title}</h2>
          <p className="text-sm text-muted dark:text-white/40">
            {t.teams.subtitle(categoryRoster.length, activeCategory.label)}
          </p>
        </div>
        <ShieldCheck className="hidden text-primary sm:block" size={22} />
      </div>

      <CategoryTabs activeIndex={categoryIndex} onChange={onCategoryChange} />

      {categoryRoster.length === 0 ? (
        <div className="rounded-2xl border border-border p-8 text-center text-sm text-muted dark:border-white/10 dark:text-white/40">
          {t.teams.empty(activeCategory.label)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categoryRoster.map((team) => (
            <motion.div
              key={team.id}
              className="flex items-center gap-3 rounded-2xl border border-border p-4 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.3)] transition-colors hover:border-primary/60 dark:border-white/10 dark:shadow-none "
              whileHover={{ y: -4 }}
              transition={{ duration: 0.15 }}
            >
              <Avatar src={teamPhotoUrl(team)} name={team.name} size={40} />
              <div className="min-w-0">
                <span className="block truncate text-sm font-bold text-ink dark:text-white">{team.name}</span>
                <CategoryBadge category={team.category} className="mt-1" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.section>
  );
}
