"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Shield, Users, MapPinned, CalendarDays, Globe } from "lucide-react";

const links = [
  { href: "/admin", label: "Posiciones", icon: Trophy },
  { href: "/admin/teams", label: "Equipos", icon: Shield },
  { href: "/admin/players", label: "Jugadores", icon: Users },
  { href: "/admin/matches", label: "Partidos", icon: CalendarDays },
  { href: "/admin/fields", label: "Canchas", icon: MapPinned },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <aside className="flex w-[76px] shrink-0 flex-col gap-8 border-r border-slate-200/70 bg-white/70 px-3 py-6 md:w-64 md:px-4">
      <div className="flex items-center gap-2.5 px-1">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg text-white shadow-[0_10px_20px_-8px_rgba(13,148,136,0.65)]">
          ⚽
        </span>
        <div className="hidden md:block">
          <p className="text-sm font-extrabold leading-tight tracking-tight text-ink">Soccer App</p>
          <p className="text-xs text-muted">Gestión de liga</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={`group flex items-center justify-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all md:justify-start ${active
                  ? "bg-primary text-white shadow-[0_12px_24px_-10px_rgba(13,148,136,0.7)]"
                  : "text-muted hover:bg-primary-light hover:text-primary"
                }`}
            >
              <Icon size={18} className="shrink-0" />
              <span className="hidden md:block">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <Link
          href="/"
          title="Ver sitio público"
          className="flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-slate-100 hover:text-ink md:justify-start"
        >
          <Globe size={18} className="shrink-0" />
          <span className="hidden md:block">Sitio público</span>
        </Link>
        <div className="hidden rounded-xl border border-slate-200/70 bg-slate-50/70 p-3 text-xs text-muted md:block">
          Temporada activa
          <p className="mt-0.5 font-semibold text-ink">Liga {new Date().getFullYear()}</p>
        </div>
      </div>
    </aside>
  );
}
