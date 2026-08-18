import { z } from "zod";

// The page-size *selector* in the UI (components/ui/pagination.tsx) only
// ever offers these three values. The backend cap is intentionally wider
// (not restricted to exactly these three): a few call sites need "give me
// effectively everything in one request" for an internal aggregate — e.g.
// the per-match card tally on app/(platform)/admin/matches/page.tsx reads
// every card for the season to count yellows/reds per match, not a page of
// them — and hard-capping the API at 50 would silently break that. 100 is
// still a real ceiling: a client can't ask for an unbounded page by editing
// the query string.
export const PAGE_SIZE_VALUES = [10, 20, 50] as const;

export const pageSizeSchema = z.coerce.number().int().min(1).max(100).default(20);
