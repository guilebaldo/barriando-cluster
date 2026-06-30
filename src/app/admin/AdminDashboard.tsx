"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  approveLinkage,
  approveManualCertification,
  deleteSocioUser,
  rejectLinkage,
  rejectManualCertification,
  updateSocioAdmin,
  type AdminUserRow,
} from "./actions";
import { listaSocios } from "@/app/data/socios";
import { getSubscriptionStatusLabel } from "@/lib/membresia";
import { PLAN_ADMIN_LABELS, MEMBERSHIP_STATUS_OPTIONS } from "@/lib/admin-labels";
import { getLinkageStatusLabel, isLinkagePending } from "@/lib/linkage";
import { formatMembershipExpiry } from "@/lib/panel-display";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Pencil,
  Shield,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import type { MembershipPlan } from "@/generated/prisma/client";

const PLANS: MembershipPlan[] = ["TURISTA", "VECINO", "NEGOCIO_FAMILIAR", "MEDIANA_EMPRESA", "GRAN_EMPRESA"];

type AdminTab = "all" | "pending";
type ResolvedAction = "approved" | "rejected";

function hasPendingLinkageRequest(user: AdminUserRow): boolean {
  return isLinkagePending(user.linkageStatus) && Boolean(user.profile?.businessName?.trim());
}

export default function AdminDashboard({ users }: { users: AdminUserRow[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>("all");
  const [msg, setMsg] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [linkageResolved, setLinkageResolved] = useState<Record<string, ResolvedAction>>({});
  const [paymentResolved, setPaymentResolved] = useState<Record<string, ResolvedAction>>({});

  const pendingLinkages = useMemo(
    () => users.filter(hasPendingLinkageRequest),
    [users]
  );

  const visibleUsers = tab === "pending" ? pendingLinkages : users;

  function openEdit(user: AdminUserRow) {
    setEditingId(user.id);
    setEditForm({
      nombre: user.nombre,
      socioId: user.socioId?.toString() ?? "",
      plan: user.plan,
      status: user.status,
      businessName: user.profile?.businessName ?? "",
      website: user.profile?.website ?? "",
      googleBusinessUrl: user.profile?.googleBusinessUrl ?? "",
      logoUrl: user.profile?.logoUrl ?? "",
      rfc: user.profile?.rfc ?? "",
      razonSocial: user.profile?.razonSocial ?? "",
      regimenFiscal: user.profile?.regimenFiscal ?? "",
      usoCfdi: user.profile?.usoCfdi ?? "",
      billingCodigoPostal: user.profile?.billingCodigoPostal ?? "",
    });
  }

  async function runAction(userId: string, action: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    setMsg("");
    setLoadingId(userId);
    const result = await action();
    setLoadingId(null);
    if (!result.ok) {
      setMsg(result.error ?? "Error");
      return;
    }
    setMsg(success);
    router.refresh();
  }

  async function runLinkageAction(
    userId: string,
    action: () => Promise<{ ok: boolean; error?: string }>,
    outcome: ResolvedAction,
    success: string
  ) {
    setMsg("");
    setLoadingId(userId);
    const result = await action();
    setLoadingId(null);
    if (!result.ok) {
      setMsg(result.error ?? "Error");
      return;
    }
    setLinkageResolved((prev) => ({ ...prev, [userId]: outcome }));
    setMsg(success);
    router.refresh();
  }

  async function runPaymentAction(
    userId: string,
    action: () => Promise<{ ok: boolean; error?: string }>,
    outcome: ResolvedAction,
    success: string
  ) {
    setMsg("");
    setLoadingId(userId);
    const result = await action();
    setLoadingId(null);
    if (!result.ok) {
      setMsg(result.error ?? "Error");
      return;
    }
    setPaymentResolved((prev) => ({ ...prev, [userId]: outcome }));
    setMsg(success);
    router.refresh();
  }

  async function handleSave(userId: string) {
    setMsg("");
    setLoadingId(userId);
    const socioIdRaw = editForm.socioId?.trim();
    const result = await updateSocioAdmin({
      userId,
      nombre: editForm.nombre,
      socioId: socioIdRaw ? Number(socioIdRaw) : null,
      plan: editForm.plan as MembershipPlan,
      status: editForm.status,
      businessName: editForm.businessName,
      website: editForm.website,
      googleBusinessUrl: editForm.googleBusinessUrl,
      logoUrl: editForm.logoUrl,
      rfc: editForm.rfc,
      razonSocial: editForm.razonSocial,
      regimenFiscal: editForm.regimenFiscal,
      usoCfdi: editForm.usoCfdi,
      billingCodigoPostal: editForm.billingCodigoPostal,
    });
    setLoadingId(null);
    if (!result.ok) {
      setMsg(result.error);
      return;
    }
    setEditingId(null);
    setMsg("Cambios guardados.");
    router.refresh();
  }

  const socioOptions = useMemo(
    () => listaSocios.map((s) => ({ id: s.id, label: `${s.name} — ${s.categoria}` })),
    []
  );

  function businessStatus(user: AdminUserRow): string {
    if (!user.profile && !user.socioId) return "Sin vincular";
    if (user.linkageStatus) {
      return getLinkageStatusLabel(user.linkageStatus as "pending" | "approved" | "rejected");
    }
    return user.socioName ?? "Vinculado";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <Shield className="w-8 h-8 text-[#27366D] shrink-0" />
          <div>
            <h1 className="text-2xl font-black font-serif-cluster uppercase tracking-wide text-slate-950">
              Administración Barriando
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Gestión de socios, vinculaciones y certificaciones.
            </p>
          </div>
        </div>
        <Link
          href="/panel"
          className="inline-flex items-center gap-2 border border-slate-200 text-[#27366D] hover:bg-slate-50 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Regresar al Panel Principal
        </Link>
      </div>

      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-4 text-xs">
          {msg}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("all")}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
            tab === "all" ? "bg-[#27366D] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Todos los usuarios ({users.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("pending")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
            tab === "pending" ? "bg-amber-500 text-slate-950" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Vinculaciones pendientes ({pendingLinkages.length})
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {visibleUsers.length === 0 ? (
          <p className="col-span-full p-8 text-sm text-slate-500 text-center bg-white border border-slate-200 rounded-xl">
            {tab === "pending" ? "No hay vinculaciones pendientes." : "No hay usuarios registrados."}
          </p>
        ) : (
          visibleUsers.map((user) => {
                const pendingPayment = user.status === "manual_pending";
                const pendingLink = hasPendingLinkageRequest(user);
                const linkageOutcome =
                  linkageResolved[user.id] ??
                  (user.linkageStatus === "approved"
                    ? "approved"
                    : user.linkageStatus === "rejected"
                      ? "rejected"
                      : null);
                const paymentOutcome =
                  paymentResolved[user.id] ??
                  (user.status === "manual_active"
                    ? "approved"
                    : user.status === "manual_rejected"
                      ? "rejected"
                      : null);
                const isEditing = editingId === user.id;

                return (
                  <div
                    key={user.id}
                    className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 text-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-900">{user.nombre}</p>
                        <p className="text-slate-500 mt-0.5 break-all">{user.email}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          title={isEditing ? "Cerrar" : "Editar"}
                          onClick={() => (isEditing ? setEditingId(null) : openEdit(user))}
                          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                        >
                          {isEditing ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          title="Eliminar"
                          disabled={loadingId === user.id}
                          onClick={() => {
                            if (!confirm(`¿Eliminar la cuenta de ${user.nombre}?`)) return;
                            runAction(user.id, () => deleteSocioUser(user.id), "Socio eliminado.");
                          }}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <p>
                        <span className="text-slate-400 uppercase tracking-wider text-[9px]">Plan</span>
                        <br />
                        {user.planLabel}
                      </p>
                      <p>
                        <span className="text-slate-400 uppercase tracking-wider text-[9px]">Membresía</span>
                        <br />
                        {getSubscriptionStatusLabel(user.status)}
                      </p>
                      <p className="col-span-2">
                        <span className="text-slate-400 uppercase tracking-wider text-[9px]">Negocio</span>
                        <br />
                        {user.requestedBusinessName ?? "—"}
                      </p>
                      <p className="col-span-2">
                        <span className="text-slate-400 uppercase tracking-wider text-[9px]">Estado negocio</span>
                        <br />
                        <span
                          className={
                            pendingLink
                              ? "text-amber-600 font-semibold"
                              : user.linkageStatus === "approved"
                                ? "text-green-700 font-semibold"
                                : "text-slate-600"
                          }
                        >
                          {businessStatus(user)}
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                      <span className="text-[9px] font-bold uppercase text-slate-400 w-full">Pago</span>
                      {paymentOutcome === "approved" && (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-bold text-green-700 bg-green-50">
                          Validado
                        </span>
                      )}
                      {paymentOutcome === "rejected" && (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-bold text-red-700 bg-red-50">
                          Rechazado
                        </span>
                      )}
                      {pendingPayment && !paymentOutcome && (
                        <>
                          <button
                            type="button"
                            disabled={loadingId === user.id}
                            onClick={() =>
                              runPaymentAction(
                                user.id,
                                () => approveManualCertification(user.id),
                                "approved",
                                "Certificación aprobada."
                              )
                            }
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-green-700 bg-green-50 hover:bg-green-100"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Aprobar
                          </button>
                          <button
                            type="button"
                            disabled={loadingId === user.id}
                            onClick={() =>
                              runPaymentAction(
                                user.id,
                                () => rejectManualCertification(user.id),
                                "rejected",
                                "Certificación rechazada."
                              )
                            }
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-red-700 bg-red-50 hover:bg-red-100"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Rechazar
                          </button>
                        </>
                      )}
                      <span className="text-[9px] font-bold uppercase text-slate-400 w-full mt-1">Vinculación</span>
                      {linkageOutcome === "approved" && (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-bold text-green-700 bg-green-50">
                          Aprobada
                        </span>
                      )}
                      {linkageOutcome === "rejected" && (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-bold text-red-700 bg-red-50">
                          Rechazada
                        </span>
                      )}
                      {pendingLink && !linkageOutcome && (
                        <>
                          <button
                            type="button"
                            disabled={loadingId === user.id}
                            onClick={() =>
                              runLinkageAction(
                                user.id,
                                () => approveLinkage(user.id),
                                "approved",
                                "Vinculación aprobada."
                              )
                            }
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-green-700 bg-green-50 hover:bg-green-100"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Aprobar
                          </button>
                          <button
                            type="button"
                            disabled={loadingId === user.id}
                            onClick={() =>
                              runLinkageAction(
                                user.id,
                                () => rejectLinkage(user.id),
                                "rejected",
                                "Vinculación rechazada."
                              )
                            }
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-red-700 bg-red-50 hover:bg-red-100"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Rechazar
                          </button>
                        </>
                      )}
                    </div>
                    {isEditing && (
                      <div className="pt-3 border-t border-slate-100 grid sm:grid-cols-2 gap-3">
                            <label className="block">
                              <span className="font-bold text-slate-500 uppercase tracking-wider">Nombre</span>
                              <input
                                className="mt-1 w-full border border-slate-200 rounded-lg p-2"
                                value={editForm.nombre ?? ""}
                                onChange={(e) => setEditForm((f) => ({ ...f, nombre: e.target.value }))}
                              />
                            </label>
                            <label className="block">
                              <span className="font-bold text-slate-500 uppercase tracking-wider">Negocio catálogo</span>
                              <select
                                className="mt-1 w-full border border-slate-200 rounded-lg p-2"
                                value={editForm.socioId ?? ""}
                                onChange={(e) => setEditForm((f) => ({ ...f, socioId: e.target.value }))}
                              >
                                <option value="">Sin vincular</option>
                                {socioOptions.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="block">
                              <span className="font-bold text-slate-500 uppercase tracking-wider">Plan</span>
                              <select
                                className="mt-1 w-full border border-slate-200 rounded-lg p-2"
                                value={editForm.plan ?? "TURISTA"}
                                onChange={(e) => setEditForm((f) => ({ ...f, plan: e.target.value }))}
                              >
                                {PLANS.map((p) => (
                                  <option key={p} value={p}>
                                    {PLAN_ADMIN_LABELS[p]}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="block">
                              <span className="font-bold text-slate-500 uppercase tracking-wider">
                                Estado membresía
                              </span>
                              <select
                                className="mt-1 w-full border border-slate-200 rounded-lg p-2"
                                value={editForm.status ?? "inactive"}
                                onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                              >
                                {MEMBERSHIP_STATUS_OPTIONS.map((o) => (
                                  <option key={o.value} value={o.value}>
                                    {o.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="block sm:col-span-2">
                              <span className="font-bold text-slate-500 uppercase tracking-wider">Nombre negocio</span>
                              <input
                                className="mt-1 w-full border border-slate-200 rounded-lg p-2"
                                value={editForm.businessName ?? ""}
                                onChange={(e) => setEditForm((f) => ({ ...f, businessName: e.target.value }))}
                              />
                            </label>
                            <div className="sm:col-span-2 lg:col-span-3 rounded-lg border border-slate-200 bg-white p-4 text-xs space-y-3">
                                <p className="font-bold text-[#27366D] uppercase tracking-wider text-[10px]">
                                  Datos fiscales (CFDI 4.0)
                                </p>
                                <div className="grid sm:grid-cols-2 gap-3">
                                  <label className="block">
                                    <span className="font-bold text-slate-500 uppercase tracking-wider">RFC</span>
                                    <input
                                      className="mt-1 w-full border border-slate-200 rounded-lg p-2 uppercase"
                                      value={editForm.rfc ?? ""}
                                      onChange={(e) => setEditForm((f) => ({ ...f, rfc: e.target.value }))}
                                    />
                                  </label>
                                  <label className="block">
                                    <span className="font-bold text-slate-500 uppercase tracking-wider">
                                      Razón social
                                    </span>
                                    <input
                                      className="mt-1 w-full border border-slate-200 rounded-lg p-2"
                                      value={editForm.razonSocial ?? ""}
                                      onChange={(e) => setEditForm((f) => ({ ...f, razonSocial: e.target.value }))}
                                    />
                                  </label>
                                  <label className="block">
                                    <span className="font-bold text-slate-500 uppercase tracking-wider">
                                      Régimen fiscal
                                    </span>
                                    <input
                                      className="mt-1 w-full border border-slate-200 rounded-lg p-2"
                                      value={editForm.regimenFiscal ?? ""}
                                      onChange={(e) => setEditForm((f) => ({ ...f, regimenFiscal: e.target.value }))}
                                    />
                                  </label>
                                  <label className="block">
                                    <span className="font-bold text-slate-500 uppercase tracking-wider">
                                      Uso de CFDI
                                    </span>
                                    <input
                                      className="mt-1 w-full border border-slate-200 rounded-lg p-2"
                                      value={editForm.usoCfdi ?? ""}
                                      onChange={(e) => setEditForm((f) => ({ ...f, usoCfdi: e.target.value }))}
                                    />
                                  </label>
                                  <label className="block">
                                    <span className="font-bold text-slate-500 uppercase tracking-wider">
                                      Código postal fiscal
                                    </span>
                                    <input
                                      className="mt-1 w-full border border-slate-200 rounded-lg p-2"
                                      value={editForm.billingCodigoPostal ?? ""}
                                      onChange={(e) =>
                                        setEditForm((f) => ({ ...f, billingCodigoPostal: e.target.value }))
                                      }
                                    />
                                  </label>
                                </div>
                              </div>
                            <div className="sm:col-span-2 lg:col-span-3">
                              <button
                                type="button"
                                disabled={loadingId === user.id}
                                onClick={() => handleSave(user.id)}
                                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg disabled:opacity-50"
                              >
                                Guardar cambios
                              </button>
                            </div>
                          </div>
                    )}
                  </div>
                );
              })
        )}
      </div>
    </div>
  );
}
