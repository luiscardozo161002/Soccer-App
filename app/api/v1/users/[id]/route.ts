import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok, noContent } from "@/lib/http/api-response";
import { ApiError } from "@/lib/errors";
import { userService } from "@/lib/services/user.service";
import { updateUserSchema } from "@/lib/validation/user.schema";
import { getSession } from "@/lib/auth/session";

export const GET = withErrorHandling(async (_req, { params }) => {
  const { id } = await params;
  const user = await userService.getById(id);
  return ok(user);
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const session = await getSession(req);
  if (!session) throw new ApiError(401, "UNAUTHORIZED", "Inicia sesión para continuar");
  const dto = updateUserSchema.parse(await req.json());
  const user = await userService.update(id, dto, session.sub);
  return ok(user, { message: "User updated" });
});

export const DELETE = withErrorHandling(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const session = await getSession(req);
  if (!session) throw new ApiError(401, "UNAUTHORIZED", "Inicia sesión para continuar");
  await userService.remove(id, session.sub);
  return noContent();
});
