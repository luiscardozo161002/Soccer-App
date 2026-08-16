import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { userRepository } from "@/lib/repositories/user.repository";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "No hay sesión activa", details: null } },
      { status: 401 }
    );
  }

  const user = await userRepository.findById(session.sub);

  return NextResponse.json({
    success: true,
    data: {
      id: session.sub,
      username: session.username,
      role: session.role,
      photoType: user?.photoType ?? null,
      photoUpdatedAt: user?.photoUpdatedAt ?? null,
    },
  });
}
