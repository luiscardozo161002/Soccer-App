import { NextResponse } from "next/server";
import { settingsRepository } from "@/lib/repositories/settings.repository";

export async function GET() {
  const record = await settingsRepository.getLogo();

  if (!record?.logo || !record.logoType) {
    return NextResponse.json(
      { success: false, error: { code: "LOGO_NOT_FOUND", message: "No logo set", details: null } },
      { status: 404 }
    );
  }

  return new NextResponse(new Uint8Array(record.logo), {
    headers: {
      "Content-Type": record.logoType,
      "Cache-Control": "no-cache",
    },
  });
}
