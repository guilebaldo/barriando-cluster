"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { listaSocios } from "../data/socios";
import { CreditCard, Upload, LogOut, Building2 } from "lucide-react";

interface PanelProps {
  user: {
    id: string;
    nombre: string;
    email: string;
    socioId: number | null;
  };
  subscription: {
    status: string;
    currentPeriodEnd: string | null;
  } | null;
  stripeConfigured: boolean;
}

export default function PanelDashboard({ user, subscription, stripeConfigured }: PanelProps) {
  const router = useRouter();
  const [logoMsg, setLogoMsg] = useState("");
  const [payMsg, setPayMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const socio = user.socioId ? listaSocios.find((s) => s.id === user.socioId) : null;

  async function handleLogout() {
    await signOut({ callbackUrl: "/login" });
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setLogoMsg("");
    const formData = new FormData();
    formData.append("logo", file);
    try {
      const res = await fetch("/api/socio/logo", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLogoMsg("Logo actualizado correctamente.");
      router.refresh();
    } catch (err) {
      setLogoMsg(err instanceof Error ? err.message : "Error al subir logo");
    } finally {
      setLoading(false);
    }
  }

  async function handlePay() {
    setPayMsg("");
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setPayMsg(err instanceof Error ? err.message : "Error al iniciar pago");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-black font-serif-cluster uppercase tracking-wide text-slate-950">
            Panel del socio
          </h1>
          <p className="text-sm text-slate-600 mt-1">Bienvenido, {user.nombre}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#27366D] uppercase tracking-wider"
        >
          <LogOut className="w-4 h-4" /> Cerrar sesión
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-[#27366D]" />
            <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">Tu negocio</h2>
          </div>
          {socio ? (
            <div>
              <p className="font-bold text-slate-950">{socio.name}</p>
              <p className="text-xs text-slate-500 mt-1">{socio.categoria}</p>
              <div className="mt-4 h-24 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                <img
                  src={`/logos/${socio.foto}.png`}
                  alt={socio.name}
                  className="max-h-full max-w-full object-contain p-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Tu cuenta no está vinculada a un negocio. Contacta al administrador para asociarla.
            </p>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="w-4 h-4 text-[#27366D]" />
            <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">Actualizar logo</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4 font-light">PNG, JPG o WebP. Máximo 2 MB.</p>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleLogoUpload}
            disabled={!socio || loading}
            className="text-xs w-full"
          />
          {logoMsg && <p className="text-xs mt-3 text-slate-600">{logoMsg}</p>}
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-[#27366D]" />
            <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">Mensualidad</h2>
          </div>
          <p className="text-sm text-slate-700 mb-2">
            Estado:{" "}
            <strong className={subscription?.status === "active" ? "text-green-700" : "text-amber-600"}>
              {subscription?.status === "active" ? "Activa" : "Inactiva / pendiente"}
            </strong>
          </p>
          {subscription?.currentPeriodEnd && (
            <p className="text-xs text-slate-500 mb-4">
              Próximo periodo hasta: {new Date(subscription.currentPeriodEnd).toLocaleDateString("es-MX")}
            </p>
          )}
          {stripeConfigured ? (
            <button
              onClick={handlePay}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-lg transition"
            >
              {subscription?.status === "active" ? "Gestionar suscripción" : "Pagar mensualidad con Stripe"}
            </button>
          ) : (
            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-4">
              Stripe aún no está configurado. El administrador debe agregar las claves en las variables de entorno.
            </p>
          )}
          {payMsg && <p className="text-xs mt-3 text-slate-600">{payMsg}</p>}
        </section>
      </div>
    </div>
  );
}
