import { z } from "zod";

const MIN_LENGTH = Number(process.env.NEXT_PUBLIC_PASSWORD_MIN_LENGTH) || 8;

export const passwordSchema = z
  .string()
  .min(MIN_LENGTH, `La contraseña debe tener al menos ${MIN_LENGTH} caracteres`)
  .regex(/[a-z]/, "Debe incluir al menos una minúscula")
  .regex(/[A-Z]/, "Debe incluir al menos una mayúscula")
  .regex(/[0-9]/, "Debe incluir al menos un número");
