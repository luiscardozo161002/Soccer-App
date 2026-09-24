import type { dictionaries } from "@/lib/i18n/dictionaries";

export type Dictionary = (typeof dictionaries)["es-MX"];

export function navLinks(t: Dictionary) {
  return [
    { href: "#proximos-partidos", label: t.nav.upcoming },
    { href: "#partidos-jugados", label: t.nav.played },
    { href: "#tabla", label: t.nav.table },
    { href: "#equipos", label: t.nav.teams },
  ];
}
