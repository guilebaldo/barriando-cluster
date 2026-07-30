"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { BookOpen, Camera, Gift, IdCard, Map as MapIcon } from "lucide-react";

export const APP_TAB_BOTTOM =
  "calc(3.5rem + env(safe-area-inset-bottom, 0px))" as const;

/** Hub móvil (tab bar + chrome) para cualquier sesión autenticada, incl. Turista. */
export function useAppMobileShell(): boolean {
  const { data: session, status } = useSession();
  return status === "authenticated" && Boolean(session?.user);
}

const TABS = [
  {
    href: "/mapa",
    label: "MAPA",
    icon: MapIcon,
    match: (p: string) => p === "/mapa" || p.startsWith("/mapa/"),
  },
  {
    href: "/cuponera?cupones=1",
    label: "Cuponera",
    icon: Gift,
    match: (p: string) => p === "/cuponera" || p.startsWith("/cuponera/"),
  },
  {
    href: "/pasaporte?escanear=1",
    label: "Escanear",
    icon: Camera,
    match: () => false,
    primary: true as const,
  },
  {
    href: "/barrid",
    label: "BarrID",
    icon: IdCard,
    match: (p: string) => p === "/barrid" || p.startsWith("/barrid/"),
  },
  {
    href: "/pasaporte",
    label: "Pasaporte",
    icon: BookOpen,
    match: (p: string) =>
      p === "/pasaporte" || p === "/pasaporte-info" || p.startsWith("/pasaporte/"),
  },
] as const;

/**
 * Tab bar inferior — móvil + sesión iniciada.
 * Vive en Providers (no dentro de Navbar) para no desmontarse en cada navegación.
 * Sin portal: Providers ya es hijo directo de <body>, así que el nav sale en el
 * HTML del servidor y está pintado desde el primer frame (nada de hueco blanco
 * bajo el shell mientras hidrata).
 */
export default function AppBottomNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const enabled = status === "authenticated" && Boolean(session?.user);

  useEffect(() => {
    const root = document.documentElement;
    // Mientras carga la sesión, respetar la clase SSR del layout (cold start).
    if (status === "loading") return;

    root.classList.toggle("app-mobile-shell", enabled);
  }, [enabled, status]);

  if (!enabled) return null;

  return (
    <nav
      className="app-bottom-nav md:hidden fixed inset-x-0 bottom-0 z-[70] bg-[#27366D] pb-[env(safe-area-inset-bottom,0px)]"
      aria-label="Navegación de app"
    >
      <ul className="grid grid-cols-5 h-14 max-w-lg mx-auto border-t border-[#1e2b58]">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = tab.match(pathname);
          const primary = "primary" in tab && tab.primary;
          return (
            <li key={tab.label} className="min-w-0">
              <Link
                href={tab.href}
                className={`flex h-full flex-col items-center justify-center gap-0.5 px-0.5 transition ${
                  active ? "text-amber-400" : "text-slate-300 active:text-white"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={`inline-flex items-center justify-center rounded-full ${
                    primary
                      ? "bg-amber-500 text-slate-950 w-10 h-10 -mt-2 shadow-md shadow-black/25"
                      : ""
                  }`}
                >
                  <Icon className={primary ? "w-5 h-5" : "w-[1.125rem] h-[1.125rem]"} />
                </span>
                <span className="text-[8px] font-bold uppercase tracking-wider truncate max-w-full">
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
