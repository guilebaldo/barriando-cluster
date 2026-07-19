"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Gift, Pencil, Search, X } from "lucide-react";
import {
  approveLinkage,
  approveManualCertification,
  setCatalogMembershipStatus,
  type AdminUserRow,
  type CatalogMembershipRow,
  type CatalogSocioRow,
} from "./actions";
import { isLinkagePending } from "@/lib/linkage";
import { computeAdminOpsStats, formatExpiryShort } from "@/lib/admin-ops";
import AdminEstablishmentQrButton from "./AdminEstablishmentQrButton";
import AdminEditDrawer from "./AdminEditDrawer";
import { playCuelume } from "./useAdminCuelume";

type OpsFilter =
  | "all"
  | "active"
  | "inactive"
  | "unlinked"
  | "linked"
  | "payments"
  | "linkages"
  | "expiring";

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function StatusSwitch({
  active,
  disabled,
  onToggle,
  label,
}: {
  active: boolean;
  disabled?: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      data-cuelume-toggle=""
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-40 ${
        active ? "bg-emerald-500" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          active ? "translate-x-[1.375rem]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function hasPendingLinkageRequest(user: AdminUserRow): boolean {
  return isLinkagePending(user.linkageStatus) && Boolean(user.profile?.businessName?.trim());
}

function resolveExpiryIso(row: CatalogMembershipRow, linked: AdminUserRow | null): string | null {
  return linked?.currentPeriodEnd ?? row.currentPeriodEnd;
}

function isExpiringSoon(iso: string | null, now: number, in15: number): boolean {
  if (!iso) return false;
  const end = new Date(iso).getTime();
  return Number.isFinite(end) && end >= now && end <= in15;
}

export default function AdminOperations({
  membershipRows,
  catalogRows,
  users,
}: {
  membershipRows: CatalogMembershipRow[];
  catalogRows: CatalogSocioRow[];
  users: AdminUserRow[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<OpsFilter>("all");
  const [savingId, setSavingId] = useState<number | string | null>(null);
  const [editingRow, setEditingRow] = useState<CatalogMembershipRow | null>(null);
  const [msg, setMsg] = useState("");

  const stats = useMemo(
    () => computeAdminOpsStats(membershipRows, users),
    [membershipRows, users]
  );

  const usersBySocioId = useMemo(() => {
    const map = new Map<number, AdminUserRow>();
    for (const user of users) {
      if (user.socioId != null) map.set(user.socioId, user);
    }
    return map;
  }, [users]);

  const pendingByBusinessName = useMemo(() => {
    const map = new Map<string, AdminUserRow[]>();
    for (const user of users) {
      if (!hasPendingLinkageRequest(user)) continue;
      const key = normalizeName(user.requestedBusinessName ?? user.profile?.businessName ?? "");
      if (!key) continue;
      const list = map.get(key) ?? [];
      list.push(user);
      map.set(key, list);
    }
    return map;
  }, [users]);

  const catalogById = useMemo(() => {
    const map = new Map<number, CatalogSocioRow>();
    for (const row of catalogRows) map.set(row.id, row);
    return map;
  }, [catalogRows]);

  const pendingPaymentUsers = useMemo(
    () => users.filter((u) => u.status === "manual_pending"),
    [users]
  );

  const pendingLinkageUsers = useMemo(
    () => users.filter((u) => hasPendingLinkageRequest(u)),
    [users]
  );

  const now = Date.now();
  const in15 = now + 15 * 24 * 60 * 60 * 1000;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return membershipRows.filter((row) => {
      const linked = usersBySocioId.get(row.socioId) ?? null;
      const pending = pendingByBusinessName.get(normalizeName(row.businessName)) ?? [];
      const expiry = resolveExpiryIso(row, linked);

      if (filter === "active" && row.status !== "active") return false;
      if (filter === "inactive" && row.status === "active") return false;
      if (filter === "linked" && !linked) return false;
      if (filter === "unlinked" && (linked || row.status !== "active")) return false;
      if (filter === "linkages" && pending.length === 0) return false;
      if (filter === "expiring" && !isExpiringSoon(expiry, now, in15)) return false;
      if (filter === "payments") {
        const payPending = linked?.status === "manual_pending";
        const needsRenew =
          row.status !== "active" ||
          (expiry ? new Date(expiry).getTime() < now : false);
        if (!payPending && !needsRenew) return false;
      }

      if (!q) return true;
      const haystack = [
        row.businessName,
        row.categoria,
        row.planLabel,
        row.paymentLabel,
        row.foto,
        row.benefitTitle,
        linked?.email,
        linked?.nombre,
        ...pending.map((u) => `${u.email} ${u.nombre}`),
        catalogById.get(row.socioId)?.website,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [
    membershipRows,
    usersBySocioId,
    pendingByBusinessName,
    filter,
    query,
    catalogById,
    now,
    in15,
  ]);

  const kpiCards: { key: OpsFilter; label: string; value: string | number; hint: string }[] = [
    {
      key: "payments",
      label: "Pagos por validar",
      value: stats.pendingPayments,
      hint: "Depósitos / transferencias",
    },
    {
      key: "linkages",
      label: "Vinculaciones",
      value: stats.pendingLinkages,
      hint: "Cuentas por aprobar",
    },
    {
      key: "active",
      label: "Socios activos",
      value: stats.activeRoster,
      hint: "Roster $600+",
    },
    {
      key: "expiring",
      label: "Por vencer (15d)",
      value: stats.expiringSoon,
      hint: "Renovar a tiempo",
    },
    {
      key: "unlinked",
      label: "Sin cuenta",
      value: stats.unlinkedActive,
      hint: "Activos sin correo",
    },
    {
      key: "all",
      label: "MRR estimado",
      value: `$${stats.mrrEstimate.toLocaleString("es-MX")}`,
      hint: "Suma planes activos",
    },
  ];

  async function toggleStatus(row: CatalogMembershipRow) {
    setMsg("");
    setSavingId(row.socioId);
    const next = row.status === "active" ? "inactive" : "active";
    const result = await setCatalogMembershipStatus(row.socioId, next);
    setSavingId(null);
    if (!result.ok) {
      playCuelume("error");
      setMsg(result.error ?? "Error");
      return;
    }
    playCuelume("success");
    setMsg(
      next === "active"
        ? `${row.businessName} activado en directorio y pasaporte.`
        : `${row.businessName} desactivado.`
    );
    router.refresh();
  }

  async function handleApprovePayment(userId: string, label: string) {
    setMsg("");
    setSavingId(userId);
    const result = await approveManualCertification(userId);
    setSavingId(null);
    if (!result.ok) {
      playCuelume("error");
      setMsg(result.error ?? "Error");
      return;
    }
    playCuelume("success");
    setMsg(`Pago validado: ${label}`);
    router.refresh();
  }

  async function handleApproveLinkage(userId: string, label: string) {
    setMsg("");
    setSavingId(userId);
    const result = await approveLinkage(userId);
    setSavingId(null);
    if (!result.ok) {
      playCuelume("error");
      setMsg(result.error ?? "Error");
      return;
    }
    playCuelume("success");
    setMsg(`Vinculación aprobada: ${label}`);
    router.refresh();
  }

  const editingLinked =
    editingRow != null ? usersBySocioId.get(editingRow.socioId) ?? null : null;
  const editingCatalog =
    editingRow != null ? catalogById.get(editingRow.socioId) ?? null : null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpiCards.map((card) => {
          const active = filter === card.key;
          return (
            <button
              key={card.key + card.label}
              type="button"
              onClick={() => setFilter(card.key)}
              data-cuelume-toggle=""
              className={`text-left rounded-xl border px-3 py-3 transition ${
                active
                  ? "border-[#27366D] bg-[#27366D] text-white shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300 text-slate-800"
              }`}
            >
              <p
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  active ? "text-white/70" : "text-slate-400"
                }`}
              >
                {card.label}
              </p>
              <p className="text-xl font-black mt-1 tabular-nums">{card.value}</p>
              <p className={`text-[10px] mt-0.5 ${active ? "text-white/60" : "text-slate-400"}`}>
                {card.hint}
              </p>
            </button>
          );
        })}
      </div>

      {filter === "payments" && pendingPaymentUsers.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
            Cola de pagos (cuentas)
          </p>
          <ul className="space-y-2">
            {pendingPaymentUsers.map((user) => (
              <li
                key={user.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white/80 border border-amber-100 rounded-lg px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {user.profile?.businessName || user.nombre || "Sin negocio"}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                </div>
                <button
                  type="button"
                  disabled={savingId === user.id}
                  onClick={() => void handleApprovePayment(user.id, user.email)}
                  data-cuelume-press=""
                  data-cuelume-release=""
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 shrink-0"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Validar depósito
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {filter === "linkages" && pendingLinkageUsers.length > 0 ? (
        <div className="rounded-xl border border-sky-200 bg-sky-50/80 p-4 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-sky-900">
            Cola de vinculaciones
          </p>
          <ul className="space-y-2">
            {pendingLinkageUsers.map((user) => (
              <li
                key={user.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white/80 border border-sky-100 rounded-lg px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {user.requestedBusinessName || user.profile?.businessName || "Negocio"}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                </div>
                <button
                  type="button"
                  disabled={savingId === user.id}
                  onClick={() => void handleApproveLinkage(user.id, user.email)}
                  data-cuelume-press=""
                  data-cuelume-release=""
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-sky-900 bg-sky-100 hover:bg-sky-200 disabled:opacity-40 shrink-0"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Aprobar vínculo
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {msg ? (
        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          {msg}
        </p>
      ) : null}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-4 border-b border-slate-200 bg-slate-50/80 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "Todos"],
                ["active", "Activos"],
                ["inactive", "Inactivos"],
                ["linked", "Con cuenta"],
                ["unlinked", "Sin cuenta"],
                ["expiring", "Por vencer"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                data-cuelume-toggle=""
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                  filter === key
                    ? "bg-[#27366D] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {label}
                {key === "all" ? ` (${membershipRows.length})` : ""}
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar negocio, correo, plan…"
                className="w-full pl-9 pr-9 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#27366D]/20 focus:border-[#27366D]"
                aria-label="Buscar negocios"
              />
              {query.trim() ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-600"
                  aria-label="Limpiar"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
            </div>
            <p className="text-[11px] text-slate-500 shrink-0">
              {visible.length} de {membershipRows.length} negocios
            </p>
          </div>
        </div>

        <div className="md:hidden divide-y divide-slate-100">
          {visible.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">No hay negocios que coincidan.</p>
          ) : (
            visible.map((row) => {
              const active = row.status === "active";
              const saving = savingId === row.socioId;
              const linked = usersBySocioId.get(row.socioId) ?? null;
              const expiry = resolveExpiryIso(row, linked);
              return (
                <article key={row.socioId} className="px-4 py-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{row.businessName}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {row.planLabel} · {row.paymentLabel}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Vence {formatExpiryShort(expiry)}
                        {row.monthsPastDue > 0
                          ? ` · ${row.monthsPastDue} mes${row.monthsPastDue === 1 ? "" : "es"} vencido${row.monthsPastDue === 1 ? "" : "s"}`
                          : ""}
                      </p>
                    </div>
                    <StatusSwitch
                      active={active}
                      disabled={saving}
                      onToggle={() => void toggleStatus(row)}
                      label={`${active ? "Desactivar" : "Activar"} ${row.businessName}`}
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 truncate">
                    {linked?.email ?? "Sin cuenta"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <AdminEstablishmentQrButton
                      businessName={row.businessName}
                      plan={row.plan}
                      disabled={saving}
                    />
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => setEditingRow(row)}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs min-w-[880px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Negocio</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Pago</th>
                <th className="px-4 py-3">Cuenta</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Vence</th>
                <th className="px-4 py-3 w-40 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    No hay negocios que coincidan.
                  </td>
                </tr>
              ) : (
                visible.map((row) => {
                  const active = row.status === "active";
                  const saving = savingId === row.socioId;
                  const linked = usersBySocioId.get(row.socioId) ?? null;
                  const pending =
                    pendingByBusinessName.get(normalizeName(row.businessName)) ?? [];
                  const expiry = resolveExpiryIso(row, linked);

                  return (
                    <tr
                      key={row.socioId}
                      className="border-b border-slate-100 align-top hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{row.businessName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {row.categoria || "—"} · id {row.socioId}
                        </p>
                        {row.offersBenefit ? (
                          <p className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-medium mt-1">
                            <Gift className="w-3 h-3" />
                            Beneficio activo
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{row.planLabel}</td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{row.paymentLabel}</td>
                      <td className="px-4 py-3">
                        {linked ? (
                          <div>
                            <p className="font-medium text-slate-800 break-all">{linked.email}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{linked.nombre}</p>
                            {linked.status === "manual_pending" ? (
                              <p className="text-[10px] text-amber-700 font-semibold mt-0.5">
                                Pago pendiente
                              </p>
                            ) : null}
                          </div>
                        ) : pending.length > 0 ? (
                          <div>
                            <p className="text-amber-800 font-medium">Pendiente vincular</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 break-all">
                              {pending.map((u) => u.email).join(", ")}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400">Sin cuenta</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-2">
                          <StatusSwitch
                            active={active}
                            disabled={saving}
                            onToggle={() => void toggleStatus(row)}
                            label={`${active ? "Desactivar" : "Activar"} ${row.businessName}`}
                          />
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider ${
                              active ? "text-emerald-700" : "text-slate-400"
                            }`}
                          >
                            {saving ? "…" : active ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        <p>{formatExpiryShort(expiry)}</p>
                        {row.monthsPastDue > 0 ? (
                          <p className="text-[10px] text-red-600 font-semibold mt-0.5">
                            {row.monthsPastDue} mes{row.monthsPastDue === 1 ? "" : "es"} vencido
                            {row.monthsPastDue === 1 ? "" : "s"}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center justify-end gap-0.5">
                          <button
                            type="button"
                            title="Editar"
                            disabled={saving}
                            onClick={() => setEditingRow(row)}
                            data-cuelume-press=""
                            data-cuelume-release=""
                            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                          >
                            <Pencil className="w-4 h-4" />
                            <span className="sr-only">Editar</span>
                          </button>
                          <AdminEstablishmentQrButton
                            businessName={row.businessName}
                            category={row.categoria}
                            plan={row.plan}
                            disabled={saving}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminEditDrawer
        open={Boolean(editingRow)}
        onClose={() => setEditingRow(null)}
        row={editingRow}
        linkedUser={editingLinked}
        catalog={editingCatalog}
      />
    </div>
  );
}
