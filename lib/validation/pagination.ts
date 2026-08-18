import { z } from "zod";

// UI selector only offers these three; the backend cap is wider (100) since
// some call sites need "everything in one request" for an internal
// aggregate (e.g. the per-match card tally on the matches admin page).
export const PAGE_SIZE_VALUES = [10, 20, 50] as const;

export const pageSizeSchema = z.coerce.number().int().min(1).max(100).default(20);
