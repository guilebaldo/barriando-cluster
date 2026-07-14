"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, Search, X } from "lucide-react";
import {
  setCatalogMembershipStatus,
  updateCatalogMembershipBenefit,
  type CatalogMembershipRow,
} from "./actions";

export default function AdminRosterSection({ rows }: { rows: CatalogMembershipRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [editingBenefitId, setEditingBenefitId] = useState<number | null>(null);
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

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter === "active" && row.status !== "active") return false;
      if (filter === "inactive" && row.status === "active") return false;
      if (!q) return true;
      const haystack = [
        row.businessName,
        row.categoria,
        row.planLabel,
        row.paymentLabel,
        row.foto,
        row.benefitTitle,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, query, filter]);

  const activeCount = rows.filter((r) => r.status === "active").length;

  function openBenefitEdit(row: CatalogMembershipRow) {
    setEditingBenefitId(row.socioId);
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

  async function toggleStatus(row: CatalogMembershipRow) {
    setMsg("");
    setSavingId(row.socioId);
    const next = row.status === "active" ? "inactive" : "active";
    const result = await setCatalogMembershipStatus(row.socioId, next);
    setSavingId(null);
    if (!result.ok) {
      setMsg(result.error ?? "Error");
      return;
    }
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
      setMsg(result.error ?? "Error al guardar beneficio.");
      return;
    }
    setEditingBenefitId(null);
    setMsg(`Beneficio de ${row.businessName} actualizado.`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-bold text-[#27366D] uppercase tracking-widest">
          Roster de membresías
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-light">
          Fuente de verdad para quién aparece en /socios y negocios del MAP. También puedes publicar
          beneficios aquí sin cuenta vinculada. {activeCount} activos de {rows.length}.
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
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar negocio, plan o pago…"
              className="w-full pl-9 pr-9 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#27366D]/20 focus:border-[#27366D]"
              aria-label="Buscar roster"
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
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Negocio</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Pago</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 w-44 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    No hay membresías que coincidan.
                  </td>
                </tr>
              ) : (
                visible.map((row) => {
                  const active = row.status === "active";
                  const saving = savingId === row.socioId;
                  const editing = editingBenefitId === row.socioId;
                  return (
                    <Fragment key={row.socioId}>
                      <tr className="border-b border-slate-100 align-top">
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
                        <td className="px-4 py-3 text-slate-700">{row.planLabel}</td>
                        <td className="px-4 py-3 text-slate-700">{row.paymentLabel}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              active
                                ? "bg-emerald-50 text-emerald-800"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {active ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex flex-col items-end gap-1.5">
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() =>
                                editing ? setEditingBenefitId(null) : openBenefitEdit(row)
                              }
                              className="text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg border border-amber-300 text-amber-800 hover:bg-amber-50 disabled:opacity-40"
                            >
                              {editing ? "Cerrar" : "Beneficio"}
                            </button>
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => void toggleStatus(row)}
                              className={`text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg transition disabled:opacity-40 ${
                                active
                                  ? "border border-slate-200 text-slate-600 hover:bg-slate-50"
                                  : "bg-[#27366D] text-white hover:bg-[#1e2b58]"
                              }`}
                            >
                              {saving ? "…" : active ? "Desactivar" : "Activar"}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {editing ? (
                        <tr className="border-b border-slate-100 bg-slate-50/80">
                          <td colSpan={5} className="px-4 py-4">
                            <div className="grid sm:grid-cols-2 gap-3 max-w-3xl">
                              <label className="inline-flex items-center gap-2 text-xs text-slate-700 sm:col-span-2">
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
                                Ofrece beneficio en /socios
                              </label>
                              <input
                                className="border border-slate-200 rounded-lg p-2 text-xs"
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
                                className="border border-slate-200 rounded-lg p-2 text-xs sm:col-span-2 min-h-[70px]"
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
                                className="border border-slate-200 rounded-lg p-2 text-xs sm:col-span-2 min-h-[60px]"
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
                              <label className="text-[10px] uppercase tracking-wider text-slate-500">
                                Válido desde
                                <input
                                  type="date"
                                  className="mt-1 w-full border border-slate-200 rounded-lg p-2 text-xs"
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
                                  className="mt-1 w-full border border-slate-200 rounded-lg p-2 text-xs"
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
                              <div className="sm:col-span-2">
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => void saveBenefit(row)}
                                  className="bg-[#27366D] hover:bg-[#1e2b58] text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg disabled:opacity-40"
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
