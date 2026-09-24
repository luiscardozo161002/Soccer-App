import { NextRequest, NextResponse } from "next/server";
import { userRepository } from "@/modules/users/server/user.repository";
import { getSession } from "@/lib/auth/session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession(req);
  if (!session || (session.role !== "admin" && session.sub !== id)) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "No tienes permiso para ver esta foto", details: null } },
      { status: 403 }
    );
  }
  const record = await userRepository.findPhoto(id);

  if (!record?.photo || !record.photoType) {
    return NextResponse.json(
      { success: false, error: { code: "PHOTO_NOT_FOUND", message: "No photo set", details: null } },
      { status: 404 }
    );
  }

  return new NextResponse(new Uint8Array(record.photo), {
    headers: {
      "Content-Type": record.photoType,
      "Cache-Control": "private, no-store",
    },
  });
}
