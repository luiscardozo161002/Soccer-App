import { motion } from "framer-motion";
import Image from "next/image";
import type { StandingsRow } from "@/modules/standings/hooks/useStandings";
import type { LeagueCategory } from "@/lib/constants/league-categories";
import {
  standingsZone,
  standingsZonesForCategory,
  STANDINGS_ZONE_BADGE_CLASSES,
  STANDINGS_ZONE_DOT_CLASSES,
} from "@/lib/constants/standings-zones";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { sectionReveal } from "@/lib/landing/animations";
import { CategoryTabs } from "@/components/landing/CategoryTabs";

export function StandingsSection({
  activeCategory,
  categoryIndex,
  onCategoryChange,
  categoryTeams,
}: {
  activeCategory: LeagueCategory;
  categoryIndex: number;
  onCategoryChange: (index: number) => void;
  categoryTeams: StandingsRow[];
}) {
  const { t } = useLocale();

  return (
    <motion.section id="tabla" className="relative mt-12 scroll-mt-24" {...sectionReveal}>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-ink dark:text-white">{t.standings.title}</h2>
          <p className="text-sm text-muted dark:text-white/40">
            {t.standings.subtitle(activeCategory.label)}
          </p>
        </div>
        <Image
          src="/images/trophy-classic.webp"
          alt=""
          width={600}
          height={970}
          className="hidden h-14 w-auto opacity-80 drop-shadow-[0_8px_16px_rgba(0,0,0,0.25)] dark:opacity-65 dark:drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] sm:block"
        />
      </div>

      <CategoryTabs activeIndex={categoryIndex} onChange={onCategoryChange} />

      <div className="overflow-hidden rounded-2xl border border-border shadow-[0_16px_40px_-28px_rgba(15,23,42,0.3)] dark:border-white/10 dark:shadow-none">
        {categoryTeams.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted dark:text-white/40">
            {t.standings.empty(activeCategory.label)}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs font-bold uppercase tracking-widest text-muted dark:border-white/10 dark:text-white/30">
              <tr>
                <th className="px-5 py-3">{t.standings.rank}</th>
                <th className="px-5 py-3">{t.standings.team}</th>
                <th className="px-5 py-3 text-center">{t.standings.played}</th>
                <th className="px-5 py-3 text-center">{t.standings.goalDiff}</th>
                <th className="px-5 py-3 text-center">{t.standings.points}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {categoryTeams.map((row, index) => {
                const zone = standingsZone(activeCategory.value, index);
                return (
                  <tr key={row.teamId}>
                    <td className="px-5 py-3">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${STANDINGS_ZONE_BADGE_CLASSES[zone]}`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-bold text-ink dark:text-white">{row.name}</td>
                    <td className="px-5 py-3 text-center text-muted dark:text-white/50">{row.played}</td>
                    <td className="px-5 py-3 text-center text-muted dark:text-white/50">{row.goalDifference}</td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary-light px-2 text-sm font-bold text-primary ">
                        {row.points}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {categoryTeams.length > 0 && (
        <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted dark:text-white/40">
          {standingsZonesForCategory(activeCategory.value).map((zone) => (
            <span key={zone} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${STANDINGS_ZONE_DOT_CLASSES[zone]}`} />
              {zone === "qualified" ? t.standings.zoneQualified : zone === "contention" ? t.standings.zoneContention : t.standings.zoneRelegation}
            </span>
          ))}
        </p>
      )}
    </motion.section>
  );
}
