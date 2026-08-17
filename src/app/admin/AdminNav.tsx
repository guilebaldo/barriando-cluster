"use client";

import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  LayoutDashboard,
  MapPinned,
  Newspaper,
  Ticket,
  Users,
} from "lucide-react";
import type { AdminTab } from "@/lib/admin-section";
import AdminNotificationBadge from "@/app/components/AdminNotificationBadge";

type NavItem = {
  id: AdminTab;
  title: string;
  hint: string;
  icon: LucideIcon;
};

const ITEMS: NavItem[] = [
  { id: "overview", title: "Resumen", hint: "Métricas", icon: LayoutDashboard },
  { id: "operations", title: "Operaciones", hint: "Roster y pagos", icon: ClipboardList },
  { id: "accounts", title: "Cuentas", hint: "Usuarios", icon: Users },
  { id: "content", title: "Contenido", hint: "Home", icon: Newspaper },
  { id: "hitos", title: "Hitos", hint: "MAPA", icon: MapPinned },
  { id: "pases", title: "Pases", hint: "Eventos", icon: Ticket },
];

type Props = {
  activeId: AdminTab;
  onSelect: (id: AdminTab) => void;
  pendingOps?: number;
  counts?: Partial<Record<AdminTab, number>>;
};

export default function AdminNav({ activeId, onSelect, pendingOps = 0, counts }: Props) {
  return (
    <>
      <nav
        aria-label="Secciones del admin"
        className="hidden md:block w-56 shrink-0 rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
      >
        <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Panel
        </p>
        <ul className="space-y-0.5">
          {ITEMS.map((item) => (
            <li key={item.id}>
              <NavButton
                item={item}
                selected={item.id === activeId}
                pendingOps={pendingOps}
                count={counts?.[item.id]}
                onSelect={onSelect}
              />
            </li>
          ))}
        </ul>
      </nav>

      <nav
        aria-label="Secciones del admin"
        className="md:hidden -mx-3 px-3 overflow-x-auto overscroll-x-contain"
      >
        <ul className="flex gap-1.5 min-w-max pb-1">
          {ITEMS.map((item) => {
            const selected = item.id === activeId;
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  aria-current={selected ? "page" : undefined}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition ${
                    selected
                      ? "bg-[#27366D] text-white"
                      : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${selected ? "text-amber-300" : "text-[#27366D]"}`} />
                  {item.title}
                  {item.id === "operations" ? (
                    <AdminNotificationBadge count={pendingOps} ring={false} />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

function NavButton({
  item,
  selected,
  pendingOps,
  count,
  onSelect,
}: {
  item: NavItem;
  selected: boolean;
  pendingOps: number;
  count?: number;
  onSelect: (id: AdminTab) => void;
}) {
  const Icon = item.icon;
  const badge = item.id === "operations" ? pendingOps : 0;
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      aria-current={selected ? "page" : undefined}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition ${
        selected ? "bg-[#27366D] text-white" : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      <Icon className={`w-4 h-4 shrink-0 ${selected ? "text-amber-300" : "text-[#27366D]"}`} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="block text-[13px] font-semibold leading-tight">{item.title}</span>
          <AdminNotificationBadge count={badge} ring={false} />
        </span>
        <span className={`mt-0.5 block text-[10px] font-bold uppercase tracking-wider ${
          selected ? "text-amber-200/90" : "text-slate-400"
        }`}>
          {typeof count === "number" ? count : item.hint}
        </span>
      </span>
    </button>
  );
}
