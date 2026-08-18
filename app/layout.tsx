import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeProvider } from "@/context/theme-context";
import { settingsService } from "@/lib/services/settings.service";
import { shade, hexToRgba, ensureDarkModeLegible } from "@/lib/utils/color";

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

export const metadata: Metadata = {
  title: "Soccer App",
  description: "Gestión de liga: equipos, jugadores, partidos y posiciones",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await settingsService.get();
  const primary = settings?.primaryColor ?? "#0d9488";
  const background = settings?.backgroundColor ?? "#eef3f1";
  // A color picked for light backgrounds can be too dark to read as text
  // against a dark-mode surface, so dark mode gets its own legible variant
  // instead of reusing the raw admin-picked hex unmodified.
  const primaryDark = ensureDarkModeLegible(primary);
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <style dangerouslySetInnerHTML={{ __html: themeVarsCss }} />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
