import { z } from "zod";
import { pageSizeSchema } from "@/lib/validation/pagination";
import { passwordSchema } from "@/lib/validation/password";
import { ROLES } from "@/lib/auth/roles";

const photoDataUrl = z
  .string()
  .startsWith("data:image/", "La foto debe ser una imagen codificada en base64");

export const createUserSchema = z.object({
  username: z.string().trim().min(3, "Mínimo 3 caracteres").max(40),
  email: z.string().trim().email("Correo inválido"),
  phoneNumber: z.string().trim().max(20).optional().or(z.literal("")),
  password: passwordSchema,
  role: z.enum(ROLES).default("admin"),
  photo: photoDataUrl.optional(),
});
export type CreateUserDto = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  username: z.string().trim().min(3).max(40).optional(),
  email: z.string().trim().email("Correo inválido").optional(),
  phoneNumber: z.string().trim().max(20).optional().or(z.literal("")),
  role: z.enum(ROLES).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  photo: photoDataUrl.nullable().optional(),
});
export type UpdateUserDto = z.infer<typeof updateUserSchema>;

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: pageSizeSchema,
  role: z.enum(ROLES).optional(),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
