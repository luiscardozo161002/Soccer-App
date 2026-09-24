import { z } from "zod";

export const PAGE_SIZE_VALUES = [10, 20, 50] as const;

export const pageSizeSchema = z.coerce.number().int().min(1).max(100).default(20);
