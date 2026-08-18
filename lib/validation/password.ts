import { z } from "zod";

// NEXT_PUBLIC_ because this schema runs both in the browser (react-hook-form
// + zodResolver, for instant feedback) and on the server (the DTO that
// actually gets enforced) — both need to agree on the same minimum.
const MIN_LENGTH = Number(process.env.NEXT_PUBLIC_PASSWORD_MIN_LENGTH) || 8;

// Applied everywhere a user picks a new password (admin creation, password
// reset) — not on login, where the stored hash is the source of truth and a
// weak legacy password must still be able to authenticate.
export const passwordSchema = z
  .string()
  .min(MIN_LENGTH, `La contraseña debe tener al menos ${MIN_LENGTH} caracteres`)
  .regex(/[a-z]/, "Debe incluir al menos una minúscula")
  .regex(/[A-Z]/, "Debe incluir al menos una mayúscula")
  .regex(/[0-9]/, "Debe incluir al menos un número");
