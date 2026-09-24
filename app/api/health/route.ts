import { NextResponse } from "next/server";
import { healthService } from "@/modules/health/server/health.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await healthService.check();
  return NextResponse.json(health, {
    status: health.status === "ok" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
