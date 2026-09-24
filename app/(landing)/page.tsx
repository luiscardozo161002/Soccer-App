"use client";

import { useState } from "react";
import { useStandings } from "@/modules/standings/hooks/useStandings";
import { useTeams } from "@/modules/teams/hooks/useTeams";
import { useMatches } from "@/modules/matches/hooks/useMatches";
import { useFields } from "@/modules/fields/hooks/useFields";
import { useSettings } from "@/modules/settings/hooks/useSettings";
import { hasMatchStarted } from "@/lib/utils/date";
import { LEAGUE_CATEGORIES } from "@/lib/constants/league-categories";
import { LocaleProvider, useLocale } from "@/lib/i18n/LocaleContext";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { UpcomingMatchesSection } from "@/components/landing/UpcomingMatchesSection";
import { PlayedMatchesSection } from "@/components/landing/PlayedMatchesSection";
import { StandingsSection } from "@/components/landing/StandingsSection";
import { TeamsSection } from "@/components/landing/TeamsSection";
import { CinematicBand } from "@/components/landing/CinematicBand";
import { PitchDivider } from "@/components/landing/PitchDivider";

export default function LandingPage() {

  const { data: settingsData } = useSettings();
  const locale = settingsData?.data.locale ?? "es-MX";
  return (
    <LocaleProvider locale={locale}>
      <LandingPageContent />
    </LocaleProvider>
  );
}

function LandingPageContent() {
  const { locale } = useLocale();
  const dateLocale = locale === "en" ? "en-US" : "es-MX";
  const { data: teamsData } = useTeams();
  const teams = teamsData?.data ?? [];
  const teamsById = Object.fromEntries(teams.map((t) => [t.id, t]));

  const { data: fieldsData } = useFields();
  const fields = fieldsData?.data ?? [];
  const fieldsById = Object.fromEntries(fields.map((f) => [f.id, f]));

  const { data: matchesData } = useMatches();
  const matches = matchesData?.data ?? [];
  const playedCount = matches.filter((m) => m.status === "played").length;
  const upcoming = matches
    .filter((m) => m.status === "scheduled" && !hasMatchStarted(m.date, m.time))
    .sort((a, b) => `${a.date}T${a.time ?? "99:99"}`.localeCompare(`${b.date}T${b.time ?? "99:99"}`));
  const played = matches
    .filter((m) => m.status === "played")
    .sort((a, b) => `${b.date}T${b.time ?? "00:00"}`.localeCompare(`${a.date}T${a.time ?? "00:00"}`));

  const { data: standingsData } = useStandings();
  const [categoryIndex, setCategoryIndex] = useState(0);
  const activeCategory = LEAGUE_CATEGORIES[categoryIndex];
  const categoryTeams = (standingsData?.data ?? []).filter((row) => row.category === activeCategory.value);
  const categoryRoster = teams.filter((team) => team.category === activeCategory.value);
  const categoryUpcoming = upcoming.filter((m) => m.category === activeCategory.value);
  const categoryPlayed = played.filter((m) => m.category === activeCategory.value);

  return (
    <div className="min-h-screen bg-surface text-ink">
      <Header />

      <HeroSection
        upcoming={upcoming}
        teamsById={teamsById}
        fieldsById={fieldsById}
        dateLocale={dateLocale}
        playedCount={playedCount}
      />

      <main className="mx-auto w-full max-w-7xl px-4 pb-4 sm:px-6">
        <UpcomingMatchesSection
          activeCategory={activeCategory}
          categoryIndex={categoryIndex}
          onCategoryChange={setCategoryIndex}
          categoryUpcoming={categoryUpcoming}
          teamsById={teamsById}
          fieldsById={fieldsById}
          dateLocale={dateLocale}
        />

        <PitchDivider />

        <PlayedMatchesSection
          activeCategory={activeCategory}
          categoryIndex={categoryIndex}
          onCategoryChange={setCategoryIndex}
          categoryPlayed={categoryPlayed}
          teamsById={teamsById}
          dateLocale={dateLocale}
        />

        <PitchDivider />

        <StandingsSection
          activeCategory={activeCategory}
          categoryIndex={categoryIndex}
          onCategoryChange={setCategoryIndex}
          categoryTeams={categoryTeams}
        />

        <PitchDivider />

        <TeamsSection
          activeCategory={activeCategory}
          categoryIndex={categoryIndex}
          onCategoryChange={setCategoryIndex}
          categoryRoster={categoryRoster}
        />
      </main>

      <CinematicBand />

      <Footer />
    </div>
  );
}
