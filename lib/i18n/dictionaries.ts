export type Locale = "es-MX" | "en";

function dictionary() {
  return {
    nav: {
      upcoming: "Próximos partidos",
      played: "Partidos jugados",
      table: "Tabla",
      teams: "Equipos",
      portal: "Portal",
      openMenu: "Abrir menú",
      closeMenu: "Cerrar menú",
    },
    footer: {
      defaultSlogan: "Resultados, calendario y posiciones actualizados en tiempo real.",
      rights: "Todos los derechos reservados.",
    },
    hero: {
      nextMatchBadge: (matchday: number) => `Próximo partido · Jornada ${matchday}`,
      seasonBadge: (year: number) => `Temporada ${year}`,
      timeTbd: "hora por confirmar",
      viewCalendar: "Ver calendario",
      viewTable: "Ver tabla",
      noMatchesTitle: "Todo el fútbol de la liga, en un solo lugar",
      noMatchesBody:
        "No hay partidos programados por el momento. Revisa la tabla de posiciones y los equipos inscritos esta temporada.",
      viewStandings: "Ver tabla de posiciones",
      quickCalendar: "Calendario",
      quickTable: "Tabla",
      quickTeams: "Equipos",
      matchesPlayed: (count: number) => `${count} partidos jugados`,
      prevMatch: "Partido anterior",
      nextMatch: "Siguiente partido",
      viewMatchN: (n: number) => `Ver partido ${n}`,
      ghostMatchday: (n: number) => `J${n}`,
      vs: "vs",
    },
    upcoming: {
      title: "Próximos partidos",
      subtitle: (category: string) => `Calendario de la liga ordenado por fecha · ${category}`,
      empty: (category: string) => `No hay partidos programados por el momento en ${category}.`,
      matchday: (n: number) => `Jornada ${n}`,
      fieldTbd: "Cancha por confirmar",
    },
    played: {
      title: "Partidos jugados",
      subtitle: (category: string) => `Resultados más recientes · ${category}`,
      empty: (category: string) => `Todavía no se han jugado partidos en ${category}.`,
      forfeit: "Definido por default",
    },
    standings: {
      title: "Tabla de posiciones",
      subtitle: (category: string) => `Tabla completa · ${category}`,
      empty: (category: string) => `Todavía no hay partidos jugados en ${category}.`,
      rank: "#",
      team: "Equipo",
      played: "J.J.",
      goalDiff: "DIF.",
      points: "PTS.",
      zoneQualified: "Calificado",
      zoneContention: "Con posibilidades",
      zoneRelegation: "Descenso",
    },
    teams: {
      title: "Equipos participantes",
      subtitle: (count: number, category: string) => `${count} equipo(s) inscritos · ${category}`,
      empty: (category: string) => `Todavía no hay equipos registrados en ${category}.`,
    },
    cinematic: {
      season: (year: number) => `Temporada ${year}`,
      tagline: "Cada jornada, en la mejor cancha",
    },
  };
}

const esMX = dictionary();

const en: ReturnType<typeof dictionary> = {
  nav: {
    upcoming: "Upcoming matches",
    played: "Played matches",
    table: "Table",
    teams: "Teams",
    portal: "Portal",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
  footer: {
    defaultSlogan: "Results, schedule, and standings updated in real time.",
    rights: "All rights reserved.",
  },
  hero: {
    nextMatchBadge: (matchday) => `Next match · Matchday ${matchday}`,
    seasonBadge: (year) => `${year} Season`,
    timeTbd: "time to be confirmed",
    viewCalendar: "View schedule",
    viewTable: "View table",
    noMatchesTitle: "All the league's football, in one place",
    noMatchesBody: "No matches are scheduled right now. Check the standings and the teams registered this season.",
    viewStandings: "View standings",
    quickCalendar: "Schedule",
    quickTable: "Table",
    quickTeams: "Teams",
    matchesPlayed: (count) => `${count} matches played`,
    prevMatch: "Previous match",
    nextMatch: "Next match",
    viewMatchN: (n) => `View match ${n}`,
    ghostMatchday: (n) => `M${n}`,
    vs: "vs",
  },
  upcoming: {
    title: "Upcoming matches",
    subtitle: (category) => `League schedule sorted by date · ${category}`,
    empty: (category) => `No matches are scheduled right now in ${category}.`,
    matchday: (n) => `Matchday ${n}`,
    fieldTbd: "Field to be confirmed",
  },
  played: {
    title: "Played matches",
    subtitle: (category) => `Most recent results · ${category}`,
    empty: (category) => `No matches have been played yet in ${category}.`,
    forfeit: "Decided by forfeit",
  },
  standings: {
    title: "Standings",
    subtitle: (category) => `Full table · ${category}`,
    empty: (category) => `No matches have been played yet in ${category}.`,
    rank: "#",
    team: "Team",
    played: "P",
    goalDiff: "GD",
    points: "PTS",
    zoneQualified: "Qualified",
    zoneContention: "In contention",
    zoneRelegation: "Relegation",
  },
  teams: {
    title: "Participating teams",
    subtitle: (count, category) => `${count} team(s) registered · ${category}`,
    empty: (category) => `No teams have been registered yet in ${category}.`,
  },
  cinematic: {
    season: (year) => `${year} Season`,
    tagline: "Every matchday, on the best field",
  },
};

export const dictionaries: Record<Locale, ReturnType<typeof dictionary>> = {
  "es-MX": esMX,
  en,
};
