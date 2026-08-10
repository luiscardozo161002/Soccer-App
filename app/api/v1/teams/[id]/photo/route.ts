import { NextResponse } from "next/server";
import { teamRepository } from "@/lib/repositories/team.repository";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = await teamRepository.findPhoto(id);

  if (!record?.photo || !record.photoType) {
    return NextResponse.json(
      { success: false, error: { code: "PHOTO_NOT_FOUND", message: "No photo set", details: null } },
      { status: 404 }
    );
  }

  return new NextResponse(new Uint8Array(record.photo), {
    headers: {
      "Content-Type": record.photoType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
