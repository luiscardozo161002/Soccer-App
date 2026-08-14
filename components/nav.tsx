"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Trophy, Shield, Users, MapPinned, CalendarDays, Globe, History, ShieldAlert, Settings, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useSeasons } from "@/hooks/useSeasons";
import { useSettings, siteLogoUrl } from "@/hooks/useSettings";
import { useMe, useLogout } from "@/hooks/useAuth";


const links = [
  { href: "/admin", label: "Posiciones", icon: Trophy },
  { href: "/admin/teams", label: "Equipos", icon: Shield },
  { href: "/admin/players", label: "Jugadores", icon: Users },
  { href: "/admin/matches", label: "Partidos", icon: CalendarDays },
  { href: "/admin/fields", label: "Canchas", icon: MapPinned },
  { href: "/admin/sanctions", label: "Sanciones", icon: ShieldAlert },
  { href: "/admin/history", label: "Historial", icon: History },
  { href: "/admin/settings", label: "Configuración", icon: Settings },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: seasonsData } = useSeasons();
  const activeSeason = seasonsData?.data.find((s) => s.status === "active");
  const { data: settingsData } = useSettings();
  const settings = settingsData?.data;
  const logoUrl = siteLogoUrl(settings);
  const { data: meData } = useMe();
  const me = meData?.data;
  const logout = useLogout();
  const { confirm, dialog } = useConfirm();

  const handleLogout = async () => {
    const ok = await confirm({
      title: "¿Cerrar sesión?",
      description: "Tendrás que volver a iniciar sesión para acceder al panel de administración.",
      confirmLabel: "Cerrar sesión",
      tone: "danger",
    });
    if (!ok) return;
    logout.mutate(undefined, {
      onSuccess: () => {
        router.push("/login");
        router.refresh();
      },
    });
  };

  return (
    <aside className="flex h-full w-[76px] shrink-0 flex-col gap-8 overflow-y-auto border-r border-border bg-surface/70 px-3 py-6 md:w-64 md:px-4">
      <div className="flex items-center gap-2.5 px-1">
        <span className="shrink-0">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt="Logo"
              width={60}
              height={60}
              className="h-[60px] w-[60px] shrink-0 rounded-full border-2 border-primary bg-white object-cover p-1"
            />
          ) : (
            <span className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary-light text-2xl">
              ⚽
            </span>
          )}
        </span>
        <div className="hidden md:block">
          <p className="text-sm font-extrabold leading-tight tracking-tight text-ink">{settings?.name ?? "Liga de Futbol"}</p>
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
                ? "bg-primary text-white"
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
        <ThemeToggle
          className="flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-primary-light hover:text-ink md:justify-start"
          label={<span className="hidden md:block">Tema</span>}
        />
        <Link
          href="/"
          title="Ver sitio público"
          className="flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-primary-light hover:text-ink md:justify-start"
        >
          <Globe size={18} className="shrink-0" />
          <span className="hidden md:block">Sitio público</span>
        </Link>
        <div className="hidden rounded-xl border border-border bg-primary-light/30 p-3 text-xs text-muted md:block">
          Temporada activa
          <p className="mt-0.5 font-semibold text-ink">{activeSeason?.name ?? `Liga ${new Date().getFullYear()}`}</p>
        </div>

        {me && (
          <div className="flex items-center gap-2 border-t border-border pt-3">
            <Avatar src={null} name={me.username} size={32} />
            <span className="hidden min-w-0 flex-1 md:block">
              <span className="block truncate text-sm font-semibold text-ink">{me.username}</span>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="shrink-0 rounded-lg p-2 text-muted transition-colors hover:bg-primary-light hover:text-red-600"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
      {dialog}
    </aside>
  );
}
