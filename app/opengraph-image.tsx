import { ImageResponse } from "next/og";
import { settingsService } from "@/lib/services/settings.service";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Reads admin-editable branding from the DB — statically generating this at
// build time would both fail (no DB access during build) and bake in stale
// branding permanently, same reasoning as app/layout.tsx's `dynamic` export.
export const dynamic = "force-dynamic";

export default async function Image() {
  const settings = await settingsService.get();
  const name = settings?.name || "Liga de Futbol";
  const slogan = settings?.slogan;
  const primary = settings?.primaryColor || "#0d9488";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${primary} 0%, #0f172a 100%)`,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 120, display: "flex", marginBottom: 24 }}>⚽</div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "#ffffff",
            textAlign: "center",
            padding: "0 80px",
            display: "flex",
          }}
        >
          {name}
        </div>
        {slogan && (
          <div
            style={{
              fontSize: 30,
              color: "rgba(255,255,255,0.8)",
              marginTop: 20,
              textAlign: "center",
              padding: "0 100px",
              display: "flex",
            }}
          >
            {slogan}
          </div>
        )}
      </div>
    ),
    { ...size }
  );
}
