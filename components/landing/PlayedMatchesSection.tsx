import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";
import type { Match } from "@/modules/matches/hooks/useMatches";
import type { Team } from "@/modules/teams/hooks/useTeams";
import { teamPhotoUrl } from "@/modules/teams/hooks/useTeams";
import { Avatar } from "@/components/ui/avatar";
import { CategoryDot } from "@/components/ui/category-badge";
import { formatCalendarDate } from "@/lib/utils/date";
import type { LeagueCategory } from "@/lib/constants/league-categories";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { sectionReveal } from "@/lib/landing/animations";
import { CategoryTabs } from "@/components/landing/CategoryTabs";

export function PlayedMatchesSection({
  activeCategory,
  categoryIndex,
  onCategoryChange,
  categoryPlayed,
  teamsById,
  dateLocale,
}: {
  activeCategory: LeagueCategory;
  categoryIndex: number;
  onCategoryChange: (index: number) => void;
  categoryPlayed: Match[];
  teamsById: Record<string, Team>;
  dateLocale: string;
}) {
  const { t } = useLocale();

  return (
    <motion.section id="partidos-jugados" className="relative mt-12 scroll-mt-24 overflow-hidden" {...sectionReveal}>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-ink dark:text-white">{t.played.title}</h2>
          <p className="text-sm text-muted dark:text-white/40">{t.played.subtitle(activeCategory.label)}</p>
        </div>
        <CalendarDays className="hidden text-primary sm:block" size={22} />
      </div>

      {/* Shares state with the other sections, so every section stays
          in sync as the visitor switches categories. */}
      <CategoryTabs activeIndex={categoryIndex} onChange={onCategoryChange} />

      {categoryPlayed.length === 0 ? (
        <div className="rounded-2xl p-8 text-center text-sm text-muted dark:text-white/40">
          {t.played.empty(activeCategory.label)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categoryPlayed.slice(0, 6).map((match) => (
            <motion.div
              key={match.id}
              className="flex flex-col gap-3 rounded-2xl border border-border p-5 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.3)] transition-colors hover:border-primary/60 dark:border-white/10 dark:shadow-none "
              whileHover={{ y: -4 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-muted dark:bg-white/5 dark:text-white/60">
                  {t.upcoming.matchday(match.matchday)}
                </span>
                <span className="text-xs font-semibold text-muted dark:text-white/40">
                  {formatCalendarDate(match.date, { day: "2-digit", month: "short" }, dateLocale)}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 py-2 text-center">
                <div className="flex flex-1 items-center justify-end gap-2">
                  <span className="text-balance text-sm font-bold leading-tight text-ink dark:text-white">
                    {teamsById[match.homeTeamId]?.name ?? "—"}
                  </span>
                  {teamsById[match.homeTeamId] && <CategoryDot category={teamsById[match.homeTeamId].category} />}
                  <Avatar
                    src={teamsById[match.homeTeamId] ? teamPhotoUrl(teamsById[match.homeTeamId]) : null}
                    name={teamsById[match.homeTeamId]?.name ?? "?"}
                    size={26}
                  />
                </div>
                <span className="shrink-0 rounded-full bg-primary-light px-2.5 py-0.5 text-sm font-black text-primary ">
                  {match.homeGoals} - {match.awayGoals}
                </span>
                <div className="flex flex-1 items-center justify-start gap-2">
                  <Avatar
                    src={teamsById[match.awayTeamId] ? teamPhotoUrl(teamsById[match.awayTeamId]) : null}
                    name={teamsById[match.awayTeamId]?.name ?? "?"}
                    size={26}
                  />
                  {teamsById[match.awayTeamId] && <CategoryDot category={teamsById[match.awayTeamId].category} />}
                  <span className="text-balance text-sm font-bold leading-tight text-ink dark:text-white">
                    {teamsById[match.awayTeamId]?.name ?? "—"}
                  </span>
                </div>
              </div>
              {match.forfeit && (
                <p className="text-center text-xs font-semibold text-muted dark:text-white/40">{t.played.forfeit}</p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.section>
  );
}
