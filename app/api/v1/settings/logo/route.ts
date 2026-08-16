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
      // Safe to cache forever: the URL includes `?v=<logoUpdatedAt>` (see
      // siteLogoUrl), so a new upload produces a new URL instead of this
      // one's bytes ever changing.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
