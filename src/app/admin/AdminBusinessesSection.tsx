"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, Pencil, RotateCcw, Search, X } from "lucide-react";
import {
  setCatalogMembershipStatus,
  updateCatalogMembershipBenefit,
  updateCatalogSocioWebsite,
  type AdminUserRow,
  type CatalogMembershipRow,
  type CatalogSocioRow,
} from "./actions";
import { isLinkagePending } from "@/lib/linkage";
import AdminEstablishmentQrButton from "./AdminEstablishmentQrButton";
import { playCuelume } from "./useAdminCuelume";

type StatusFilter = "all" | "active" | "inactive" | "unlinked" | "linked";

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

export default function AdminBusinessesSection({
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
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [websiteDrafts, setWebsiteDrafts] = useState<Record<number, string>>({});
  const [benefitForm, setBenefitForm] = useState({
    offersBenefit: false,
    benefitTitle: "",
    benefitDescription: "",
    benefitHowToRedeem: "",
    benefitRedeemViaQr: true,
    benefitValidFrom: "",
    benefitValidUntil: "",
  });
  const [msg, setMsg] = useState("");

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

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return membershipRows.filter((row) => {
      const linked = usersBySocioId.get(row.socioId) ?? null;
      const pending = pendingByBusinessName.get(normalizeName(row.businessName)) ?? [];
      if (filter === "active" && row.status !== "active") return false;
      if (filter === "inactive" && row.status === "active") return false;
      if (filter === "linked" && !linked) return false;
      if (filter === "unlinked" && linked) return false;
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
  }, [membershipRows, usersBySocioId, pendingByBusinessName, filter, query, catalogById]);

  const activeCount = membershipRows.filter((r) => r.status === "active").length;
  const linkedCount = membershipRows.filter((r) => usersBySocioId.has(r.socioId)).length;

  function openExpand(row: CatalogMembershipRow) {
    setExpandedId(row.socioId);
    setBenefitForm({
      offersBenefit: row.offersBenefit,
      benefitTitle: row.benefitTitle,
      benefitDescription: row.benefitDescription,
      benefitHowToRedeem: row.benefitHowToRedeem,
      benefitRedeemViaQr: row.benefitRedeemViaQr,
      benefitValidFrom: row.benefitValidFrom,
      benefitValidUntil: row.benefitValidUntil,
    });
  }

  function websiteDraftFor(row: CatalogMembershipRow): string {
    const catalog = catalogById.get(row.socioId);
    return websiteDrafts[row.socioId] ?? catalog?.website ?? "";
  }

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
        ? `${row.businessName} activado en /socios y MAP.`
        : `${row.businessName} desactivado (ya no aparece en /socios ni MAP).`
    );
    router.refresh();
  }

  async function saveBenefit(row: CatalogMembershipRow) {
    setMsg("");
    setSavingId(row.socioId);
    const result = await updateCatalogMembershipBenefit({
      socioId: row.socioId,
      ...benefitForm,
    });
    setSavingId(null);
    if (!result.ok) {
      playCuelume("error");
      setMsg(result.error ?? "Error al guardar beneficio.");
      return;
    }
    playCuelume("success");
    setMsg(`Beneficio de ${row.businessName} actualizado.`);
    router.refresh();
  }

  async function saveWebsite(row: CatalogMembershipRow) {
    setMsg("");
    setSavingId(row.socioId);
    const website = websiteDraftFor(row).trim();
    const result = await updateCatalogSocioWebsite({ socioId: row.socioId, website });
    setSavingId(null);
    if (!result.ok) {
      playCuelume("error");
      setMsg(result.error ?? "Error al guardar sitio web.");
      return;
    }
    playCuelume("success");
    setWebsiteDrafts((prev) => {
      const next = { ...prev };
      delete next[row.socioId];
      return next;
    });
    setMsg(`Sitio web de ${row.businessName} actualizado.`);
    router.refresh();
  }

  async function resetWebsite(row: CatalogMembershipRow) {
    setMsg("");
    setSavingId(row.socioId);
    const result = await updateCatalogSocioWebsite({ socioId: row.socioId, website: "" });
    setSavingId(null);
    if (!result.ok) {
      playCuelume("error");
      setMsg(result.error ?? "Error al restablecer.");
      return;
    }
    playCuelume("success");
    setWebsiteDrafts((prev) => {
      const next = { ...prev };
      delete next[row.socioId];
      return next;
    });
    setMsg(`Sitio web de ${row.businessName} restablecido al catálogo.`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-slate-500 font-light">
          Todos los negocios del roster. Cuando un dueño se registra, solo vincula su correo a uno de
          estos. {activeCount} activos · {linkedCount} con cuenta · {membershipRows.length} en total.
        </p>
      </div>

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
                placeholder="Buscar negocio, correo vinculado, plan…"
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
              {query.trim() ? " encontrados" : ""}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[720px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Negocio</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Pago</th>
                <th className="px-4 py-3">Cuenta</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 w-28 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    No hay negocios que coincidan.
                  </td>
                </tr>
              ) : (
                visible.map((row) => {
                  const active = row.status === "active";
                  const saving = savingId === row.socioId;
                  const expanded = expandedId === row.socioId;
                  const linked = usersBySocioId.get(row.socioId) ?? null;
                  const pending =
                    pendingByBusinessName.get(normalizeName(row.businessName)) ?? [];
                  const catalog = catalogById.get(row.socioId);
                  const websiteDraft = websiteDraftFor(row);
                  const websiteDirty =
                    websiteDraft.trim() !== (catalog?.website ?? "").trim();

                  return (
                    <Fragment key={row.socioId}>
                      <tr className="border-b border-slate-100 align-top hover:bg-slate-50/80">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800">{row.businessName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {row.categoria || "—"} · id {row.socioId}
                            {row.foto ? ` · ${row.foto}` : ""}
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
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center justify-end gap-0.5">
                            <button
                              type="button"
                              title={expanded ? "Cerrar" : "Editar"}
                              disabled={saving}
                              onClick={() =>
                                expanded ? setExpandedId(null) : openExpand(row)
                              }
                              data-cuelume-press=""
                              data-cuelume-release=""
                              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                            >
                              {expanded ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                              <span className="sr-only">{expanded ? "Cerrar" : "Editar"}</span>
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
                      {expanded ? (
                        <tr className="border-b border-slate-100 bg-slate-50/80">
                          <td colSpan={6} className="px-4 py-4">
                            <div className="grid lg:grid-cols-2 gap-6 max-w-4xl">
                              <div className="space-y-3">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[#27366D]">
                                  Sitio web (/socios)
                                </p>
                                <input
                                  type="url"
                                  value={websiteDraft}
                                  onChange={(e) =>
                                    setWebsiteDrafts((prev) => ({
                                      ...prev,
                                      [row.socioId]: e.target.value,
                                    }))
                                  }
                                  className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#27366D]/20 focus:border-[#27366D]"
                                  placeholder="https://…"
                                />
                                {catalog?.hasOverride ? (
                                  <p className="text-[10px] text-slate-400 truncate" title={catalog.catalogUrl}>
                                    Catálogo original: {catalog.catalogUrl}
                                  </p>
                                ) : null}
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    disabled={saving || !websiteDirty}
                                    onClick={() => void saveWebsite(row)}
                                    data-cuelume-press=""
                                    data-cuelume-release=""
                                    className="bg-[#27366D] hover:bg-[#1e2b58] disabled:opacity-40 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg"
                                  >
                                    Guardar URL
                                  </button>
                                  {catalog?.hasOverride ? (
                                    <button
                                      type="button"
                                      disabled={saving}
                                      onClick={() => void resetWebsite(row)}
                                      data-cuelume-press=""
                                      data-cuelume-release=""
                                      className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700 disabled:opacity-40"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                      Restablecer
                                    </button>
                                  ) : null}
                                </div>

                                <div className="pt-3 border-t border-slate-200">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#27366D] mb-2">
                                    Cuenta vinculada
                                  </p>
                                  {linked ? (
                                    <div className="text-xs text-slate-700 space-y-1">
                                      <p>
                                        <span className="text-slate-400">Correo:</span> {linked.email}
                                      </p>
                                      <p>
                                        <span className="text-slate-400">Nombre:</span> {linked.nombre}
                                      </p>
                                      <p>
                                        <span className="text-slate-400">Plan cuenta:</span>{" "}
                                        {linked.planLabel}
                                      </p>
                                      <p className="text-[10px] text-slate-500 pt-1">
                                        Para editar plan/pago de la cuenta o desvincular, usa la pestaña
                                        Cuentas.
                                      </p>
                                    </div>
                                  ) : pending.length > 0 ? (
                                    <p className="text-xs text-amber-800">
                                      Hay solicitud(es) pendientes. Revísalas en la pestaña Pendientes.
                                    </p>
                                  ) : (
                                    <p className="text-xs text-slate-500">
                                      Sin cuenta. Al registrarse, el dueño solicita vincular este negocio
                                      y tú lo apruebas en Pendientes (o lo asignas desde Cuentas).
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-3">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[#27366D]">
                                  Beneficio en /socios
                                </p>
                                <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={benefitForm.offersBenefit}
                                    onChange={(e) =>
                                      setBenefitForm((f) => ({
                                        ...f,
                                        offersBenefit: e.target.checked,
                                      }))
                                    }
                                  />
                                  Ofrece beneficio
                                </label>
                                <input
                                  className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                                  placeholder="Título del beneficio"
                                  value={benefitForm.benefitTitle}
                                  onChange={(e) =>
                                    setBenefitForm((f) => ({ ...f, benefitTitle: e.target.value }))
                                  }
                                  disabled={!benefitForm.offersBenefit}
                                />
                                <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={benefitForm.benefitRedeemViaQr}
                                    onChange={(e) =>
                                      setBenefitForm((f) => ({
                                        ...f,
                                        benefitRedeemViaQr: e.target.checked,
                                      }))
                                    }
                                    disabled={!benefitForm.offersBenefit}
                                  />
                                  Canje vía QR BarrID
                                </label>
                                <textarea
                                  className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white min-h-[70px]"
                                  placeholder="Descripción"
                                  value={benefitForm.benefitDescription}
                                  onChange={(e) =>
                                    setBenefitForm((f) => ({
                                      ...f,
                                      benefitDescription: e.target.value,
                                    }))
                                  }
                                  disabled={!benefitForm.offersBenefit}
                                />
                                <textarea
                                  className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white min-h-[60px]"
                                  placeholder="Cómo canjearlo (si no usa QR)"
                                  value={benefitForm.benefitHowToRedeem}
                                  onChange={(e) =>
                                    setBenefitForm((f) => ({
                                      ...f,
                                      benefitHowToRedeem: e.target.value,
                                    }))
                                  }
                                  disabled={!benefitForm.offersBenefit}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                  <label className="text-[10px] uppercase tracking-wider text-slate-500">
                                    Válido desde
                                    <input
                                      type="date"
                                      className="mt-1 w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                                      value={benefitForm.benefitValidFrom}
                                      onChange={(e) =>
                                        setBenefitForm((f) => ({
                                          ...f,
                                          benefitValidFrom: e.target.value,
                                        }))
                                      }
                                      disabled={!benefitForm.offersBenefit}
                                    />
                                  </label>
                                  <label className="text-[10px] uppercase tracking-wider text-slate-500">
                                    Válido hasta
                                    <input
                                      type="date"
                                      className="mt-1 w-full border border-slate-200 rounded-lg p-2 text-xs bg-white"
                                      value={benefitForm.benefitValidUntil}
                                      onChange={(e) =>
                                        setBenefitForm((f) => ({
                                          ...f,
                                          benefitValidUntil: e.target.value,
                                        }))
                                      }
                                      disabled={!benefitForm.offersBenefit}
                                    />
                                  </label>
                                </div>
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => void saveBenefit(row)}
                                  data-cuelume-press=""
                                  data-cuelume-release=""
                                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg disabled:opacity-40"
                                >
                                  {saving ? "Guardando…" : "Guardar beneficio"}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
