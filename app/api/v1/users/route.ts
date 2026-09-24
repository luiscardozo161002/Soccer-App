import { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/middleware/error-handler";
import { ok } from "@/lib/http/api-response";
import { userService } from "@/modules/users/server/user.service";
import { createUserSchema, listUsersQuerySchema } from "@/modules/users/user.schema";
import { getSession } from "@/lib/auth/session";
import { assertAdmin } from "@/lib/auth/match-access";

export const GET = withErrorHandling(async (req) => {
  assertAdmin(await getSession(req));
  const query = listUsersQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
  const { items, totalItems, totalPages } = await userService.list(query);

  return ok(items, {
    meta: { page: query.page, pageSize: query.pageSize, totalItems, totalPages },
  });
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  assertAdmin(await getSession(req));
  const dto = createUserSchema.parse(await req.json());
  const user = await userService.create(dto);
  return ok(user, { status: 201, message: "User created" });
});
