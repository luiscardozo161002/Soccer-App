import { z } from "zod";

export const createUserSchema = z.object({
  username: z.string().trim().min(3, "Mínimo 3 caracteres").max(40),
  email: z.string().trim().email("Correo inválido"),
  phoneNumber: z.string().trim().max(20).optional().or(z.literal("")),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  role: z.string().trim().min(1).max(30).default("admin"),
});
export type CreateUserDto = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  username: z.string().trim().min(3).max(40).optional(),
  email: z.string().trim().email("Correo inválido").optional(),
  phoneNumber: z.string().trim().max(20).optional().or(z.literal("")),
  role: z.string().trim().min(1).max(30).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});
export type UpdateUserDto = z.infer<typeof updateUserSchema>;

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
