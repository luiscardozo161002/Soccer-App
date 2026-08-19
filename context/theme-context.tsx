"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

type Theme = "light" | "dark";

const ThemeContext = createContext<{ theme: Theme; toggle: () => void } | null>(null);

function defaultForPath(pathname: string): Theme {
  return pathname.startsWith("/admin") ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const pathname = usePathname();

  // Re-runs on every client-side navigation, not just the initial hard load
  // — otherwise logging in (a router.push from /login to /admin, no reload)
  // never re-evaluates the per-section default and keeps whatever theme the
  // login page happened to be on. An explicit stored choice always wins
  // over the path-based default, on every navigation.
  useEffect(() => {
    const stored = window.localStorage.getItem("theme");
    const next: Theme = stored === "light" || stored === "dark" ? stored : defaultForPath(pathname);
    setThemeState(next);
    document.documentElement.setAttribute("data-theme", next);
  }, [pathname]);

  const toggle = () => {
    setThemeState((t) => {
      const next = t === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      window.localStorage.setItem("theme", next);
      return next;
    });
  };

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
