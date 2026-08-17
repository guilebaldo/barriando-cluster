"use client";

import {
  BookOpen,
  Stamp,
  Ticket,
  UserPlus,
  Users,
  Building2,
  Eye,
  ClipboardList,
} from "lucide-react";
import type { AdminOverviewStats } from "@/lib/admin-overview";
import type { AdminTab } from "@/lib/admin-section";

function formatCount(value: number): string {
  return new Intl.NumberFormat("es-MX").format(value);
}

type Card = {
  id: string;
  label: string;
  value: string;
  hint: string;
  icon: typeof BookOpen;
  tab?: AdminTab;
};

export default function AdminOverview({
  stats,
  pendingOps,
  onOpen,
}: {
  stats: AdminOverviewStats;
  pendingOps: number;
  onOpen: (tab: AdminTab) => void;
}) {
  const visitsKnown = stats.siteVisitors30d != null || stats.sitePageviews30d != null;
  const visitValue = visitsKnown
    ? formatCount(stats.sitePageviews30d ?? stats.siteVisitors30d ?? 0)
    : "—";
  const visitHint = visitsKnown
    ? `${formatCount(stats.siteVisitors30d ?? 0)} visitantes · 30 días`
    : "Activa Web Analytics en Vercel para ver visitas";

  const cards: Card[] = [
    {
      id: "passports",
      label: "Pasaportes sellados",
      value: formatCount(stats.sealedPassports),
      hint: "Cuentas con al menos un sello",
      icon: BookOpen,
      tab: "accounts",
    },
    {
      id: "stamps",
      label: "Sellos dados",
      value: formatCount(stats.totalStamps),
      hint: `${formatCount(stats.stampsLast30Days)} en los últimos 30 días`,
      icon: Stamp,
      tab: "accounts",
    },
    {
      id: "visits",
      label: "Visitas del sitio",
      value: visitValue,
      hint: visitHint,
      icon: Eye,
    },
    {
      id: "users",
      label: "Cuentas",
      value: formatCount(stats.totalUsers),
      hint: `${formatCount(stats.usersLast30Days)} nuevas · 30 días`,
      icon: Users,
      tab: "accounts",
    },
    {
      id: "tourists",
      label: "Turistas",
      value: formatCount(stats.registeredTourists),
      hint: "Plan Turista registrado",
      icon: UserPlus,
      tab: "accounts",
    },
    {
      id: "businesses",
      label: "Negocios certificados",
      value: formatCount(stats.certifiedBusinesses),
      hint: `${formatCount(stats.totalSocios)} con vecinos activos`,
      icon: Building2,
      tab: "operations",
    },
    {
      id: "tickets",
      label: "Pases emitidos",
      value: formatCount(stats.ticketsIssued),
      hint: `${formatCount(stats.publishedEvents)} eventos publicados`,
      icon: Ticket,
      tab: "pases",
    },
    {
      id: "pending",
      label: "Pendientes",
      value: formatCount(pendingOps),
      hint: "Pagos y vinculaciones por revisar",
      icon: ClipboardList,
      tab: "operations",
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-bold text-[#27366D] uppercase tracking-widest">Resumen</h2>
        <p className="text-sm text-slate-500 mt-1">
          Actividad del Pasaporte, el sitio y las operaciones del Clúster.
        </p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          const interactive = Boolean(card.tab);
          const className =
            "text-left rounded-xl border border-slate-200 bg-white p-4 shadow-sm min-w-0 " +
            (interactive ? "hover:border-[#27366D]/30 hover:shadow transition" : "");
          const body = (
            <>
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#27366D]/8 text-[#27366D]">
                <Icon className="w-4 h-4" />
              </span>
              <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-tight">
                {card.label}
              </p>
              <p className="mt-1 text-2xl font-black tabular-nums text-[#27366D] leading-none">
                {card.value}
              </p>
              <p className="mt-2 text-[11px] text-slate-500 leading-snug">{card.hint}</p>
            </>
          );
          if (!card.tab) {
            return (
              <article key={card.id} className={className}>
                {body}
              </article>
            );
          }
          return (
            <button key={card.id} type="button" onClick={() => onOpen(card.tab!)} className={className}>
              {body}
            </button>
          );
        })}
      </div>
    </div>
  );
}
