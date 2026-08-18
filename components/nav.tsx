"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Trophy, Shield, Users, MapPinned, CalendarDays, Globe, History, ShieldAlert, Settings, LogOut, PanelLeftClose, PanelLeftOpen, LoaderCircle, Award } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useSeasons } from "@/hooks/useSeasons";
import { useSettings, siteLogoUrl } from "@/hooks/useSettings";
import { useMe, useLogout } from "@/hooks/useAuth";
import { adminPhotoUrl } from "@/hooks/useUsers";


const links = [
  { href: "/admin", label: "Posiciones", icon: Trophy },
  { href: "/admin/teams", label: "Equipos", icon: Shield },
  { href: "/admin/players", label: "Jugadores", icon: Users },
  { href: "/admin/matches", label: "Partidos", icon: CalendarDays },
  { href: "/admin/cup", label: "Copa", icon: Award },
  { href: "/admin/fields", label: "Canchas", icon: MapPinned },
  { href: "/admin/sanctions", label: "Sanciones", icon: ShieldAlert },
  { href: "/admin/history", label: "Historial", icon: History },
  { href: "/admin/settings", label: "Configuración", icon: Settings },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { data: seasonsData } = useSeasons();
  const activeSeason = seasonsData?.data.find((s) => s.status === "active");
  const { data: settingsData, isLoading: isSettingsLoading } = useSettings();
  const settings = settingsData?.data;
  const logoUrl = siteLogoUrl(settings);
  const { data: meData } = useMe();
  const me = meData?.data;
  const logout = useLogout();
  const { confirm, dialog } = useConfirm();

  useEffect(() => {
    const stored = window.localStorage.getItem("sidebarCollapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem("sidebarCollapsed", String(next));
      return next;
    });
  };

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
    <aside
      className={`relative flex h-full shrink-0 flex-col border-r border-border bg-surface/70 transition-[width] duration-200 ${collapsed ? "w-[68px]" : "w-56"
        }`}
    >
      {/* Sits outside the scrollable div below (as a sibling, not a child)
          so it isn't clipped by that div's own overflow box and never adds
          to its scrollable area. */}
      <button
        type="button"
        onClick={toggleCollapsed}
        title={collapsed ? "Expandir menú" : "Reducir menú"}
        aria-label={collapsed ? "Expandir menú" : "Reducir menú"}
        className="absolute -right-5 top-12 z-30 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-md shadow-primary/30 transition-all hover:scale-110 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/40 active:scale-95"
      >
        {collapsed ? <PanelLeftOpen size={18} className="shrink-0" /> : <PanelLeftClose size={18} className="shrink-0" />}
      </button>

      <div
        className={`scrollbar-modern flex h-full flex-col gap-3 overflow-y-auto px-3 py-1.5 ${collapsed ? "" : "px-3.5"
          }`}
      >
        <div className="flex items-center gap-2 px-1">
          <span className="shrink-0">
            {isSettingsLoading ? (
              // Skeleton only while actually loading — a loaded settings
              // response with no logo falls through to the icon below.
              <span className="block h-11 w-11 shrink-0 animate-pulse rounded-full bg-primary-light" />
            ) : logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Logo"
                className="h-11 w-11 shrink-0 rounded-full border-2 border-primary bg-white object-cover p-1"
              />
            ) : (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary-light text-xl">
                <LoaderCircle className="animate-spin text-white" size={24} />
              </span>
            )}
          </span>
          <div className={collapsed ? "hidden" : "block"}>
            <p className="text-xs font-extrabold leading-tight tracking-tight text-ink">{settings?.name ?? "Liga de Futbol"}</p>
            <p className="text-[11px] text-muted">Gestión de liga</p>
          </div>
        </div>

        <nav className="flex flex-col gap-0.5">
          {links.map(({ href, label, icon: Icon }) => {
            const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={`group flex items-center gap-2.5 rounded-full px-2.5 py-1 text-sm font-extralight transition-all ${collapsed ? "justify-center" : "justify-start"} ${active
                  ? "bg-primary text-white"
                  : "text-muted hover:bg-primary-light hover:text-primary"
                  }`}
              >
                <Icon size={16} className="shrink-0" />
                <span className={collapsed ? "hidden" : "block"}>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-1.5">
          <ThemeToggle
            className={`flex items-center gap-2 rounded-full px-2.5 py-1 text-sm font-extralight text-muted transition-colors hover:bg-primary-light hover:text-ink ${collapsed ? "justify-center" : "justify-start"}`}
            label={<span className={collapsed ? "hidden" : "block"}>Tema</span>}
          />
          <Link
            href="/"
            title="Ver sitio público"
            className={`flex items-center gap-2 rounded-full px-2.5 py-1 text-sm font-extralight text-muted transition-colors hover:bg-primary-light hover:text-ink ${collapsed ? "justify-center" : "justify-start"}`}
          >
            <Globe size={16} className="shrink-0" />
            <span className={collapsed ? "hidden" : "block"}>Sitio público</span>
          </Link>
          <div className={`rounded-lg border border-border bg-primary-light/30 p-1.5 text-[11px] text-muted ${collapsed ? "hidden" : "block"}`}>
            Temporada activa
            <p className="mt-0.5 font-semibold text-ink">{activeSeason?.name ?? `Liga ${new Date().getFullYear()}`}</p>
          </div>

          {me && (
            <div className={`flex items-center gap-2 border-t border-border pt-1.5 ${collapsed ? "justify-center" : ""}`}>
              {!collapsed && <Avatar src={adminPhotoUrl(me)} name={me.username} size={28} />}
              <span className={`min-w-0 flex-1 ${collapsed ? "hidden" : "block"}`}>
                <span className="block truncate text-sm font-semibold text-ink">{me.username}</span>
              </span>
              <button
                type="button"
                onClick={handleLogout}
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
                className="shrink-0 rounded-full p-1.5 text-muted transition-colors hover:bg-primary-light hover:text-red-600"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
      {dialog}
    </aside>
  );
}
