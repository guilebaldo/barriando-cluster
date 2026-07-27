"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { BookOpen, Gift, IdCard, Map as MapIcon } from "lucide-react";
import { isAdminUser } from "@/lib/admin";
import { isPaidMember } from "@/lib/membresia";
import type { MembershipPlan } from "@/generated/prisma/client";

export function useAppMobileShell(): boolean {
  const { data: session, status } = useSession();
  if (status !== "authenticated" || !session?.user) return false;
  const plan = (session.user.plan ?? "TURISTA") as MembershipPlan;
  const subscriptionStatus = session.user.subscriptionStatus ?? "inactive";
  const isAdmin = isAdminUser({
    email: session.user.email,
    role: session.user.role,
  });
  return isPaidMember(plan, subscriptionStatus) || isAdmin;
}

const TABS = [
  { href: "/mapa", label: "MAPA", icon: MapIcon, match: (p: string) => p === "/mapa" || p.startsWith("/mapa/") },
  {
    href: "/cuponera?cupones=1",
    label: "Cuponera",
    icon: Gift,
    match: (p: string) => p === "/cuponera" || p.startsWith("/cuponera/"),
  },
  {
    href: "/barrid",
    label: "BarrID",
    icon: IdCard,
    match: (p: string) => p === "/barrid" || p.startsWith("/barrid/"),
    primary: true,
  },
  {
    href: "/pasaporte",
    label: "Pasaporte",
    icon: BookOpen,
    match: (p: string) =>
      p === "/pasaporte" || p === "/pasaporte-info" || p.startsWith("/pasaporte/"),
  },
] as const;

/** Tab bar inferior — solo móvil + membresía de pago / admin. Desktop no lo usa. */
export default function AppBottomNav() {
  const pathname = usePathname();
  const enabled = useAppMobileShell();
  if (!enabled) return null;

  return (
    <nav
      className="md:hidden fixed inset-x-0 bottom-0 z-[70] border-t border-[#1e2b58] bg-[#27366D]/98 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      aria-label="Navegación de app"
    >
      <ul className="grid grid-cols-4 h-14 max-w-lg mx-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = tab.match(pathname);
          const primary = "primary" in tab && tab.primary;
          return (
            <li key={tab.label} className="min-w-0">
              <Link
                href={tab.href}
                className={`flex h-full flex-col items-center justify-center gap-0.5 px-1 transition ${
                  active ? "text-amber-400" : "text-slate-300 hover:text-white"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={`inline-flex items-center justify-center rounded-full ${
                    primary
                      ? active
                        ? "bg-amber-500 text-slate-950 w-9 h-9 -mt-1"
                        : "bg-white/15 text-white w-9 h-9 -mt-1"
                      : ""
                  }`}
                >
                  <Icon className={primary ? "w-5 h-5" : "w-4.5 h-4.5 w-[1.125rem] h-[1.125rem]"} />
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider truncate max-w-full">
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
