export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    me: ["auth", "me"] as const,
  },
  cards: {
    all: ["cards"] as const,
    list: (filters: object) => ["cards", "list", filters] as const,
  },
  cardReasonConfigs: {
    all: ["card-reason-configs"] as const,
    list: (filters: object) => ["card-reason-configs", "list", filters] as const,
  },
  fields: {
    all: ["fields"] as const,
    list: (filters: object) => ["fields", "list", filters] as const,
  },
  matches: {
    all: ["matches"] as const,
    list: (filters: object) => ["matches", "list", filters] as const,
    latestMatchday: ["matches", "latest-matchday"] as const,
  },
  matchEvidence: {
    all: ["match-evidence"] as const,
    byMatch: (matchId: string) => ["match-evidence", "match", matchId] as const,
  },
  players: {
    all: ["players"] as const,
    list: (filters: object) => ["players", "list", filters] as const,
  },
  sanctions: {
    all: ["sanctions"] as const,
    list: (filters: object) => ["sanctions", "list", filters] as const,
  },
  seasons: {
    all: ["seasons"] as const,
    detail: (id: string) => ["seasons", "detail", id] as const,
  },
  standings: {
    all: ["standings"] as const,
    list: (seasonId: string) => ["standings", "list", seasonId] as const,
  },
  settings: {
    all: ["settings"] as const,
  },
  teams: {
    all: ["teams"] as const,
    list: (filters: object) => ["teams", "list", filters] as const,
  },
  users: {
    all: ["users"] as const,
    list: (filters: object) => ["users", "list", filters] as const,
  },
} as const;
