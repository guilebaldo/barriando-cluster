"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveManualCertification, type AdminUserRow } from "./actions";
import { getSubscriptionStatusLabel } from "@/lib/membresia";
import { CheckCircle2, Shield } from "lucide-react";

export default function AdminDashboard({ users }: { users: AdminUserRow[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleApprove(userId: string) {
    setMsg("");
    setLoadingId(userId);
    const result = await approveManualCertification(userId);
    setLoadingId(null);
    if (!result.ok) {
      setMsg(result.error);
      return;
    }
    setMsg("Certificación aprobada correctamente.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Shield className="w-8 h-8 text-[#27366D] shrink-0" />
        <div>
          <h1 className="text-2xl font-black font-serif-cluster uppercase tracking-wide text-slate-950">
            Administración Barriando
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Socios registrados en la plataforma y validación manual de pagos.
          </p>
        </div>
      </div>

      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-4 text-xs">
          {msg}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-[#27366D] uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 font-bold">Usuario</th>
              <th className="px-4 py-3 font-bold">Correo</th>
              <th className="px-4 py-3 font-bold">Negocio</th>
              <th className="px-4 py-3 font-bold">Plan</th>
              <th className="px-4 py-3 font-bold">Estado</th>
              <th className="px-4 py-3 font-bold">Registro</th>
              <th className="px-4 py-3 font-bold">Acción</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const pending = user.status === "manual_pending";
              return (
                <tr key={user.id} className="border-b border-slate-100 last:border-0">
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
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleDateString("es-MX")}
                  </td>
                  <td className="px-4 py-3">
                    {pending ? (
                      <button
                        type="button"
                        disabled={loadingId === user.id}
                        onClick={() => handleApprove(user.id)}
                        className="inline-flex items-center gap-1.5 bg-[#27366D] hover:bg-[#1e2b58] text-white font-bold uppercase tracking-wider px-3 py-2 rounded-lg disabled:opacity-50 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {loadingId === user.id ? "..." : "Aprobar Certificación"}
                      </button>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="p-6 text-sm text-slate-500 text-center">No hay usuarios registrados.</p>
        )}
      </div>
    </div>
  );
}
