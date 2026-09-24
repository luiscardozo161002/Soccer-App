import { cache } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeProvider } from "@/context/theme-context";
import { settingsService } from "@/modules/settings/server/settings.service";
import { logger } from "@/lib/observability/logger";
import { shade, hexToRgba, ensureDarkModeLegible } from "@/lib/utils/color";

const getSettings = cache(async () => {
  try {
    return await settingsService.get();
  } catch (error) {
    logger.error("settings.load.failed", { error });
    return null;
  }
});

const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var theme = stored === "light" || stored === "dark"
      ? stored
      : (location.pathname.startsWith("/admin") ? "light" : "dark");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.APP_URL || "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const name = settings?.name || "Liga de Futbol";
  const description =
    settings?.slogan ||
    "Tabla de posiciones, calendario de partidos y equipos de la liga, actualizados en tiempo real.";

  return {
    metadataBase: new URL(baseUrl),
    title: name,
    description,
    alternates: { canonical: "/" },
    other: { google: "notranslate" },
    openGraph: {
      title: name,
      description,
      url: "/",
      siteName: name,
      locale: "es_MX",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();
  const primary = settings?.primaryColor ?? "#0d9488";
  const background = settings?.backgroundColor ?? "#eef3f1";
  const primaryDark = ensureDarkModeLegible(primary);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    name: settings?.name || "Liga de Futbol",
    description: settings?.slogan || undefined,
    sport: "Soccer",
    url: baseUrl,
  };
  const themeVarsCss = `
    :root {
      --color-primary: ${primary};
      --color-primary-hover: ${shade(primary, 0.15)};
      --color-primary-light: ${hexToRgba(primary, 0.12)};
      --background: ${background};
    }
    :root[data-theme="dark"] {
      --color-primary: ${primaryDark};
      --color-primary-hover: ${shade(primaryDark, -0.2)};
      --color-primary-light: ${hexToRgba(primaryDark, 0.16)};
      --background: ${shade(background, 0.85)};
    }
  `;

  return (
    <html
      lang="es"
      translate="no"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased notranslate`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <style dangerouslySetInnerHTML={{ __html: themeVarsCss }} />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
