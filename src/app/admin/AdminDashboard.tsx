"use client";

import { Fragment, useMemo, useState } from "react";
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

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden max-w-full">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[900px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-[#27366D] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 font-bold">Nombre</th>
                <th className="px-4 py-3 font-bold">Correo</th>
                <th className="px-4 py-3 font-bold">Plan activo</th>
                <th className="px-4 py-3 font-bold">Negocio solicitado</th>
                <th className="px-4 py-3 font-bold">Estado negocio</th>
                <th className="px-4 py-3 font-bold">Membresía</th>
                <th className="px-4 py-3 font-bold text-center">Pago validado</th>
                <th className="px-4 py-3 font-bold text-center">Vinculación aprobada</th>
                <th className="px-4 py-3 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleUsers.map((user) => {
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
                const expiry = formatMembershipExpiry(user.currentPeriodEnd);

                return (
                  <Fragment key={user.id}>
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-900">{user.nombre}</td>
                      <td className="px-4 py-3 text-slate-600">{user.email}</td>
                      <td className="px-4 py-3 text-slate-700">{user.planLabel}</td>
                      <td className="px-4 py-3 text-slate-800 font-medium max-w-[10rem]">
                        {user.requestedBusinessName ?? (
                          <span className="text-slate-400 font-normal">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
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
                        {user.isManualEntry && user.profile?.address && (
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[12rem]">
                            {user.profile.address}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {getSubscriptionStatusLabel(user.status)}
                        {user.currentPeriodEnd && (
                          <span className="block text-[10px] text-slate-400">Vence: {expiry}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {paymentOutcome === "approved" && (
                          <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50">
                            Sí
                          </span>
                        )}
                        {paymentOutcome === "rejected" && (
                          <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50">
                            Rechazado
                          </span>
                        )}
                        {pendingPayment && !paymentOutcome && (
                          <div className="flex justify-center gap-1">
                            <button
                              type="button"
                              title="Aprobar pago manual"
                              disabled={loadingId === user.id}
                              onClick={() =>
                                runPaymentAction(
                                  user.id,
                                  () => approveManualCertification(user.id),
                                  "approved",
                                  "Certificación aprobada."
                                )
                              }
                              className="p-2 rounded-lg text-[#27366D] hover:bg-slate-100 disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              title="Rechazar pago manual"
                              disabled={loadingId === user.id}
                              onClick={() =>
                                runPaymentAction(
                                  user.id,
                                  () => rejectManualCertification(user.id),
                                  "rejected",
                                  "Certificación rechazada."
                                )
                              }
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        {!pendingPayment && !paymentOutcome && (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {linkageOutcome === "approved" && (
                          <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50">
                            Sí
                          </span>
                        )}
                        {linkageOutcome === "rejected" && (
                          <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50">
                            Rechazado
                          </span>
                        )}
                        {pendingLink && !linkageOutcome && (
                          <div className="flex justify-center gap-1">
                            <button
                              type="button"
                              title="Aprobar vinculación"
                              disabled={loadingId === user.id}
                              onClick={() =>
                                runLinkageAction(
                                  user.id,
                                  () => approveLinkage(user.id),
                                  "approved",
                                  "Vinculación aprobada."
                                )
                              }
                              className="p-2 rounded-lg text-green-700 hover:bg-green-50 disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              title="Rechazar vinculación"
                              disabled={loadingId === user.id}
                              onClick={() =>
                                runLinkageAction(
                                  user.id,
                                  () => rejectLinkage(user.id),
                                  "rejected",
                                  "Vinculación rechazada."
                                )
                              }
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        {!pendingLink && !linkageOutcome && (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end flex-wrap gap-1.5 items-center">
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
                      </td>
                    </tr>
                    {isEditing && (
                      <tr className="bg-slate-50">
                        <td colSpan={9} className="px-4 py-4">
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                            {user.profile && (
                              <div className="sm:col-span-2 lg:col-span-3 rounded-lg border border-slate-200 bg-white p-4 text-xs space-y-2">
                                <p className="font-bold text-[#27366D] uppercase tracking-wider text-[10px]">
                                  Datos fiscales (CFDI 4.0)
                                </p>
                                <p>
                                  <span className="text-slate-500">RFC:</span>{" "}
                                  {user.profile.rfc || "—"}
                                </p>
                                <p>
                                  <span className="text-slate-500">Razón social:</span>{" "}
                                  {user.profile.razonSocial || "—"}
                                </p>
                                <p>
                                  <span className="text-slate-500">Régimen:</span>{" "}
                                  {user.profile.regimenFiscal || "—"}
                                </p>
                                <p>
                                  <span className="text-slate-500">Uso CFDI:</span>{" "}
                                  {user.profile.usoCfdi || "—"}
                                </p>
                                <p>
                                  <span className="text-slate-500">Dirección:</span>{" "}
                                  {user.profile.billingAddressFull || user.profile.address || "—"}
                                </p>
                                {(user.profile.billingStreet || user.profile.billingCodigoPostal) && (
                                  <p className="text-slate-600">
                                    {[
                                      user.profile.billingStreet,
                                      user.profile.billingColonia,
                                      user.profile.billingCiudad,
                                      user.profile.billingEstado,
                                      user.profile.billingPais,
                                      user.profile.billingCodigoPostal &&
                                        `C.P. ${user.profile.billingCodigoPostal}`,
                                    ]
                                      .filter(Boolean)
                                      .join(", ")}
                                  </p>
                                )}
                              </div>
                            )}
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
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        {visibleUsers.length === 0 && (
          <p className="p-8 text-sm text-slate-500 text-center">
            {tab === "pending" ? "No hay vinculaciones pendientes." : "No hay usuarios registrados."}
          </p>
        )}
      </div>
    </div>
  );
}
