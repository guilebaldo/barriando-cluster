"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  approveManualCertification,
  deleteSocioUser,
  updateSocioAdmin,
  type AdminUserRow,
} from "./actions";
import { listaSocios } from "@/app/data/socios";
import { getSubscriptionStatusLabel } from "@/lib/membresia";
import { formatMembershipExpiry } from "@/lib/panel-display";
import { CheckCircle2, Pencil, Shield, Trash2, X } from "lucide-react";
import type { MembershipPlan } from "@/generated/prisma/client";

const PLANS: MembershipPlan[] = ["VECINO", "NEGOCIO_FAMILIAR", "MEDIANA_EMPRESA", "GRAN_EMPRESA"];

export default function AdminDashboard({ users }: { users: AdminUserRow[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});

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

  async function handleApprove(userId: string) {
    setMsg("");
    setLoadingId(userId);
    const result = await approveManualCertification(userId);
    setLoadingId(null);
    if (!result.ok) {
      setMsg(result.error);
      return;
    }
    setMsg("Certificación aprobada hasta fin de mes.");
    router.refresh();
  }

  async function handleDelete(userId: string, nombre: string) {
    if (!confirm(`¿Eliminar la cuenta de ${nombre}? Esta acción no se puede deshacer.`)) return;
    setMsg("");
    setLoadingId(userId);
    const result = await deleteSocioUser(userId);
    setLoadingId(null);
    if (!result.ok) {
      setMsg(result.error);
      return;
    }
    setMsg("Socio eliminado.");
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

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Shield className="w-8 h-8 text-[#27366D] shrink-0" />
        <div>
          <h1 className="text-2xl font-black font-serif-cluster uppercase tracking-wide text-slate-950">
            Administración Barriando
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Gestión total de socios, vinculaciones y certificaciones manuales.
          </p>
        </div>
      </div>

      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-4 text-xs">
          {msg}
        </div>
      )}

      <div className="space-y-4">
        {users.map((user) => {
          const pending = user.status === "manual_pending";
          const isEditing = editingId === user.id;
          const expiry = formatMembershipExpiry(user.currentPeriodEnd);

          return (
            <div key={user.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[#27366D] uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 font-bold">Usuario</th>
                      <th className="px-4 py-3 font-bold">Correo</th>
                      <th className="px-4 py-3 font-bold">Negocio</th>
                      <th className="px-4 py-3 font-bold">Plan</th>
                      <th className="px-4 py-3 font-bold">Estado</th>
                      <th className="px-4 py-3 font-bold">Vence</th>
                      <th className="px-4 py-3 font-bold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-3 font-medium text-slate-900">{user.nombre}</td>
                      <td className="px-4 py-3 text-slate-600">{user.email}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {user.socioName ?? (user.socioId ? `#${user.socioId}` : "—")}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{user.planLabel}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            user.status === "active" || user.status === "manual_active"
                              ? "text-green-700 font-semibold"
                              : pending
                                ? "text-amber-600 font-semibold"
                                : "text-slate-500"
                          }
                        >
                          {getSubscriptionStatusLabel(user.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{expiry}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {pending && (
                            <button
                              type="button"
                              disabled={loadingId === user.id}
                              onClick={() => handleApprove(user.id)}
                              className="inline-flex items-center gap-1 bg-[#27366D] hover:bg-[#1e2b58] text-white font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Aprobar
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => (isEditing ? setEditingId(null) : openEdit(user))}
                            className="inline-flex items-center gap-1 border border-slate-300 text-slate-700 font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg hover:bg-slate-50"
                          >
                            {isEditing ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                            {isEditing ? "Cerrar" : "Editar"}
                          </button>
                          <button
                            type="button"
                            disabled={loadingId === user.id}
                            onClick={() => handleDelete(user.id, user.nombre)}
                            className="inline-flex items-center gap-1 border border-red-200 text-red-700 font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {isEditing && (
                <div className="border-t border-slate-100 bg-slate-50 p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <label className="block">
                    <span className="font-bold text-slate-500 uppercase tracking-wider">Nombre</span>
                    <input
                      className="mt-1 w-full border border-slate-200 rounded-lg p-2"
                      value={editForm.nombre ?? ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, nombre: e.target.value }))}
                    />
                  </label>
                  <label className="block">
                    <span className="font-bold text-slate-500 uppercase tracking-wider">Negocio vinculado</span>
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
                      value={editForm.plan ?? "VECINO"}
                      onChange={(e) => setEditForm((f) => ({ ...f, plan: e.target.value }))}
                    >
                      {PLANS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="font-bold text-slate-500 uppercase tracking-wider">Estado</span>
                    <input
                      className="mt-1 w-full border border-slate-200 rounded-lg p-2"
                      value={editForm.status ?? ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                      placeholder="active, manual_active, manual_pending, inactive"
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="font-bold text-slate-500 uppercase tracking-wider">Nombre negocio</span>
                    <input
                      className="mt-1 w-full border border-slate-200 rounded-lg p-2"
                      value={editForm.businessName ?? ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, businessName: e.target.value }))}
                    />
                  </label>
                  <label className="block">
                    <span className="font-bold text-slate-500 uppercase tracking-wider">Sitio web</span>
                    <input
                      className="mt-1 w-full border border-slate-200 rounded-lg p-2"
                      value={editForm.website ?? ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, website: e.target.value }))}
                    />
                  </label>
                  <label className="block">
                    <span className="font-bold text-slate-500 uppercase tracking-wider">Google My Business</span>
                    <input
                      className="mt-1 w-full border border-slate-200 rounded-lg p-2"
                      value={editForm.googleBusinessUrl ?? ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, googleBusinessUrl: e.target.value }))}
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="font-bold text-slate-500 uppercase tracking-wider">URL logo</span>
                    <input
                      className="mt-1 w-full border border-slate-200 rounded-lg p-2"
                      value={editForm.logoUrl ?? ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, logoUrl: e.target.value }))}
                    />
                  </label>
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
        })}
        {users.length === 0 && (
          <p className="p-6 text-sm text-slate-500 text-center bg-white border border-slate-200 rounded-xl">
            No hay usuarios registrados.
          </p>
        )}
      </div>
    </div>
  );
}
