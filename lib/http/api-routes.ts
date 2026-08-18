// Single source of truth for every API path the client calls. Hooks build
// on top of these (adding their own query strings) instead of writing
// "/api/v1/..." literals — one typo here breaks a build instead of failing
// silently at request time.
export const API_ROUTES = {
  auth: {
    login: "/api/v1/auth/login",
    logout: "/api/v1/auth/logout",
    me: "/api/v1/auth/me",
    forgotPassword: "/api/v1/auth/forgot-password",
    resetPassword: "/api/v1/auth/reset-password",
  },
  teams: {
    list: "/api/v1/teams",
    byId: (id: string) => `/api/v1/teams/${id}`,
    photo: (id: string) => `/api/v1/teams/${id}/photo`,
  },
  players: {
    list: "/api/v1/players",
    byId: (id: string) => `/api/v1/players/${id}`,
    photo: (id: string) => `/api/v1/players/${id}/photo`,
  },
  fields: {
    list: "/api/v1/fields",
    byId: (id: string) => `/api/v1/fields/${id}`,
  },
  matches: {
    list: "/api/v1/matches",
    byId: (id: string) => `/api/v1/matches/${id}`,
    result: (id: string) => `/api/v1/matches/${id}/result`,
  },
  cards: {
    list: "/api/v1/cards",
    byId: (id: string) => `/api/v1/cards/${id}`,
    pay: (id: string) => `/api/v1/cards/${id}/pay`,
    sanctions: (cardId: string) => `/api/v1/cards/${cardId}/sanctions`,
  },
  sanctions: {
    list: "/api/v1/sanctions",
    byId: (id: string) => `/api/v1/sanctions/${id}`,
    pay: (id: string) => `/api/v1/sanctions/${id}/pay`,
  },
  seasons: {
    list: "/api/v1/seasons",
    byId: (id: string) => `/api/v1/seasons/${id}`,
  },
  settings: {
    get: "/api/v1/settings",
    logo: "/api/v1/settings/logo",
  },
  standings: {
    list: "/api/v1/standings",
  },
  tournament: {
    reset: "/api/v1/tournament/reset",
  },
  users: {
    list: "/api/v1/users",
    byId: (id: string) => `/api/v1/users/${id}`,
    photo: (id: string) => `/api/v1/users/${id}/photo`,
  },
  cups: {
    list: "/api/v1/cups",
    byId: (id: string) => `/api/v1/cups/${id}`,
  },
  cupEntries: {
    list: "/api/v1/cup-entries",
    withdraw: (id: string) => `/api/v1/cup-entries/${id}/withdraw`,
  },
  cupMatches: {
    list: "/api/v1/cup-matches",
    byId: (id: string) => `/api/v1/cup-matches/${id}`,
    result: (id: string) => `/api/v1/cup-matches/${id}/result`,
    reopen: (id: string) => `/api/v1/cup-matches/${id}/reopen`,
  },
} as const;
