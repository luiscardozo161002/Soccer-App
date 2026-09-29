"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Shield, Users, MapPinned, CalendarDays, Globe, History, ShieldAlert, Settings, LogOut, PanelLeftClose, PanelLeftOpen, ClipboardCheck, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useSeasons } from "@/modules/seasons/hooks/useSeasons";
import { useSettings, siteLogoUrl } from "@/modules/settings/hooks/useSettings";
import { useMe, useLogout } from "@/modules/auth/hooks/useAuth";
import { adminPhotoUrl } from "@/modules/users/hooks/useUsers";


const links = [
  { href: "/admin", label: "Posiciones", icon: Trophy },
  { href: "/admin/teams", label: "Equipos", icon: Shield },
  { href: "/admin/players", label: "Jugadores", icon: Users },
  { href: "/admin/matches", label: "Partidos", icon: CalendarDays },
  { href: "/admin/fields", label: "Canchas", icon: MapPinned },
  { href: "/admin/sanctions", label: "Sanciones y Tarjetas", icon: ShieldAlert },
  { href: "/admin/history", label: "Historial", icon: History },
  { href: "/admin/settings", label: "Configuración", icon: Settings },
];

const refereeLinks = [{ href: "/admin/my-matches", label: "Mis partidos", icon: ClipboardCheck }];

const SIDEBAR_STORAGE_KEY = "sidebarCollapsed";
const SIDEBAR_CHANGE_EVENT = "sidebar-collapsed-change";

function subscribeToSidebar(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(SIDEBAR_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SIDEBAR_CHANGE_EVENT, callback);
  };
}

function sidebarSnapshot() {
  return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
}

function subscribeToDesktopMedia(callback: () => void) {
  const media = window.matchMedia("(min-width: 768px)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function desktopSnapshot() {
  return window.matchMedia("(min-width: 768px)").matches;
}

export function Nav() {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(subscribeToSidebar, sidebarSnapshot, () => false);
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null);
  const mobileOpen = mobileMenuPath === pathname;
  const isDesktop = useSyncExternalStore(subscribeToDesktopMedia, desktopSnapshot, () => false);
  const { data: seasonsData } = useSeasons();
  const activeSeason = seasonsData?.data.find((s) => s.status === "active");
  const { data: settingsData, isLoading: isSettingsLoading } = useSettings();
  const settings = settingsData?.data;
  const logoUrl = siteLogoUrl(settings);
  const { data: meData, isLoading: isMeLoading } = useMe();
  const me = meData?.data;
  const logout = useLogout();
  const { confirm, dialog } = useConfirm();
  // While the role is still loading, show no links at all rather than
  // defaulting to the full admin set — a referee must never see (even for a
  // frame) links to sections they don't have access to.
  const navLinks = isMeLoading ? [] : me?.role === "arbitro" ? refereeLinks : links;

  const toggleCollapsed = () => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(!collapsed));
    window.dispatchEvent(new Event(SIDEBAR_CHANGE_EVENT));
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
        window.location.replace("/login");
      },
    });
  };

  return (
    <>

      <div className="fixed inset-x-0 top-0 z-20 flex items-center gap-3 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur-sm md:hidden">
        <button
          type="button"
          onClick={() => setMobileMenuPath(pathname)}
          aria-label="Abrir menú"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-primary-light"
        >
          <Menu size={20} />
        </button>
        <span className="truncate text-sm font-extrabold tracking-tight text-ink">
          {settings?.name ?? "Liga de Futbol"}
        </span>
      </div>

      {mobileOpen && (
        <div
          onClick={() => setMobileMenuPath(null)}
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm md:hidden"
        />
      )}

      <aside

        style={isDesktop ? undefined : { left: mobileOpen ? 0 : "-18rem" }}
        className={`fixed inset-y-0 z-40 flex h-full w-72 shrink-0 flex-col border-r border-border bg-surface transition-[left] duration-200 md:relative md:z-auto md:bg-surface/70 md:transition-[width] ${collapsed ? "md:w-[68px]" : "md:w-56"
          }`}
      >
        <button
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? "Expandir menú" : "Reducir menú"}
          aria-label={collapsed ? "Expandir menú" : "Reducir menú"}
          className="absolute -right-5 top-12 z-30 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-md shadow-primary/30 transition-all hover:scale-110 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/40 active:scale-95 md:flex"
        >
          {collapsed ? <PanelLeftOpen size={18} className="shrink-0" /> : <PanelLeftClose size={18} className="shrink-0" />}
        </button>
        <button
          type="button"
          onClick={() => setMobileMenuPath(null)}
          aria-label="Cerrar menú"
          className="absolute right-3 top-3 z-30 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-primary-light hover:text-ink md:hidden"
        >
          <X size={18} className="shrink-0" />
        </button>

        <div
          className={`scrollbar-modern flex h-full flex-col gap-3 overflow-y-auto px-3.5 py-1.5 ${collapsed ? "md:px-3" : ""}`}
        >
          <div className="flex items-center gap-2 px-1">
            <span className="shrink-0">
              {isSettingsLoading ? (

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
                  <Trophy className="text-primary" size={22} />
                </span>
              )}
            </span>
            <div className={collapsed ? "md:hidden" : ""}>
              <p className="text-xs font-extrabold leading-tight tracking-tight text-ink">{settings?.name ?? "Liga de Futbol"}</p>
              <p className="text-[11px] text-muted">Gestión de liga</p>
            </div>
          </div>

          <nav className="flex flex-col gap-0.5">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  title={label}
                  className={`group flex items-center justify-start gap-2.5 rounded-full px-2.5 py-1 text-sm font-extralight transition-all ${collapsed ? "md:justify-center" : ""} ${active
                    ? "bg-primary text-white"
                    : "text-muted hover:bg-primary-light hover:text-primary"
                    }`}
                >
                  <Icon size={16} className="shrink-0" />
                  <span className={collapsed ? "md:hidden" : ""}>{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-1.5">
            <ThemeToggle
              className={`flex items-center justify-start gap-2 rounded-full px-2.5 py-1 text-sm font-extralight text-muted transition-colors hover:bg-primary-light hover:text-ink ${collapsed ? "md:justify-center" : ""}`}
              label={<span className={collapsed ? "md:hidden" : ""}>Tema</span>}
            />
            <Link
              href="/"
              title="Ver sitio público"
              className={`flex items-center justify-start gap-2 rounded-full px-2.5 py-1 text-sm font-extralight text-muted transition-colors hover:bg-primary-light hover:text-ink ${collapsed ? "md:justify-center" : ""}`}
            >
              <Globe size={16} className="shrink-0" />
              <span className={collapsed ? "md:hidden" : ""}>Sitio público</span>
            </Link>
            <div className={`rounded-lg border border-border bg-primary-light/30 p-1.5 text-[11px] text-muted ${collapsed ? "md:hidden" : ""}`}>
              Temporada activa
              <p className="mt-1 text-[9px] font-light ">{activeSeason?.name ?? `Liga ${new Date().getFullYear()}`}</p>
            </div>

            {me && (
              <div className={`flex items-center gap-2 border-t border-border pt-1.5 ${collapsed ? "md:justify-center" : ""}`}>
                <span className={collapsed ? "md:hidden" : ""}>
                  <Avatar src={adminPhotoUrl(me)} name={me.username} size={28} />
                </span>
                <span className={`min-w-0 flex-1 ${collapsed ? "md:hidden" : ""}`}>
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
    </>
  );
}
