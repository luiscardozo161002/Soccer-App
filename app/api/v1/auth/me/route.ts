import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { userRepository } from "@/modules/users/server/user.repository";

export async function GET(req: NextRequest) {
  const session = await getSession(req);

  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "No hay sesión activa", details: null } },
      { status: 401 }
    );
  }

  const user = await userRepository.findById(session.sub);
  if (!user || user.status !== "active") {
    return NextResponse.json(
      { success: false, error: { code: "SESSION_EXPIRED", message: "Tu sesión terminó. Inicia sesión nuevamente.", details: null } },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      id: session.sub,
      username: user.username,
      role: user.role,
      photoType: user?.photoType ?? null,
      photoUpdatedAt: user?.photoUpdatedAt ?? null,
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
