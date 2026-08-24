export const ROLES = ["admin", "arbitro"] as const;
export type Role = (typeof ROLES)[number];
