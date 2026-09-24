import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok, noContent } from "@/lib/http/api-response";
import { userService } from "@/modules/users/server/user.service";
import { updateUserSchema } from "@/modules/users/user.schema";
import { getSession } from "@/lib/auth/session";
import { assertAdmin } from "@/lib/auth/match-access";

export const GET = withErrorHandling(async (req, { params }) => {
  assertAdmin(await getSession(req));
  const { id } = await params;
  const user = await userService.getById(id);
  return ok(user);
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const session = await getSession(req);
  assertAdmin(session);
  const dto = updateUserSchema.parse(await req.json());
  const user = await userService.update(id, dto, session.sub);
  return ok(user, { message: "User updated" });
});

export const DELETE = withErrorHandling(async (req: NextRequest, { params }) => {
  const { id } = await params;
  const session = await getSession(req);
  assertAdmin(session);
  await userService.remove(id, session.sub);
  return noContent();
});
