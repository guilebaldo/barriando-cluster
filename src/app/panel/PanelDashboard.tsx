"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  COMMERCIAL_BENEFITS,
  MEMBERSHIP_PLANS,
  PAID_PLANS,
  formatPlanPriceMxn,
  getPlanLabel,
  getSubscriptionStatusLabel,
  hasCommercialAccess,
  isVecinoPlan,
  canLinkSocioAccount,
  isSubscriptionStatusPending,
  type PaidMembershipPlan,
} from "@/lib/membresia";
import { linkSocioAccount, reportManualPayment } from "./actions";
import SocioProfileForm from "./SocioProfileForm";
import TransferPaymentSection from "./TransferPaymentSection";
import type { MembershipPlan } from "@/generated/prisma/client";
import {
  Building2,
  CreditCard,
  Link2,
  MapPin,
  Sparkles,
  Upload,
  CheckCircle2,
} from "lucide-react";

interface SocioOption {
  id: number;
  name: string;
  categoria: string;
}

interface PanelProps {
  user: {
    id: string;
    nombre: string;
    email: string;
    socioId: number | null;
  };
  subscription: {
    plan: MembershipPlan;
    status: string;
    currentPeriodEnd: string | null;
  };
  socioProfile: {
    businessName: string;
    website: string;
    googleBusinessUrl: string;
    logoUrl: string;
  } | null;
  catalogSocio: {
    name: string;
    categoria: string;
    foto: string;
    url: string;
    direccion?: string;
  } | null;
  stripeConfigured: boolean;
  showWelcome: boolean;
  paymentNotice?: string | null;
  socios: SocioOption[];
}

export default function PanelDashboard({
  user,
  subscription,
  socioProfile,
  catalogSocio,
  stripeConfigured,
  showWelcome,
  paymentNotice,
  socios,
}: PanelProps) {
  const router = useRouter();
  const { update } = useSession();
  const [activeTab, setActiveTab] = useState<PaidMembershipPlan>("NEGOCIO_FAMILIAR");
  const [linkSocioId, setLinkSocioId] = useState("");
  const [linkMsg, setLinkMsg] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [logoMsg, setLogoMsg] = useState("");
  const [payMsg, setPayMsg] = useState("");
  const [manualMsg, setManualMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const isVecino = isVecinoPlan(subscription.plan);
  const commercial = hasCommercialAccess(subscription.plan, subscription.status);
  const canLink = canLinkSocioAccount(subscription.status);
  const pendingValidation = isSubscriptionStatusPending(subscription.status);

  const displayName = socioProfile?.businessName || catalogSocio?.name;
  const displayLogo = socioProfile?.logoUrl || (catalogSocio ? `/logos/${catalogSocio.foto}.png` : null);

  const profileDefaults = {
    businessName: socioProfile?.businessName ?? catalogSocio?.name ?? "",
    website: socioProfile?.website ?? catalogSocio?.url ?? "",
    googleBusinessUrl: socioProfile?.googleBusinessUrl ?? catalogSocio?.direccion ?? "",
    logoUrl: socioProfile?.logoUrl ?? "",
  };

  async function refreshSession() {
    await update();
    router.refresh();
  }

  async function handleLinkSocio() {
    if (!linkSocioId) return;
    setLinkLoading(true);
    setLinkMsg("");
    const result = await linkSocioAccount(Number(linkSocioId));
    setLinkLoading(false);
    if (!result.ok) {
      setLinkMsg(result.error);
      return;
    }
    setLinkMsg(`¡Vinculado con ${result.socioName}! Plan asignado: ${result.planLabel}.`);
    setLinkSocioId("");
    await refreshSession();
  }

  async function handleManualPayment(plan: MembershipPlan) {
    setManualMsg("");
    const result = await reportManualPayment(plan);
    if (!result.ok) {
      setManualMsg(result.error);
      return;
    }
    setManualMsg("Solicitud registrada. Tu plan aparece como Pendiente de Validación.");
    await refreshSession();
  }

  async function handleStripePay(plan: MembershipPlan) {
    setPayMsg("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setPayMsg(err instanceof Error ? err.message : "Error al iniciar pago");
    }
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

  return (
    <div className="space-y-6">
      {paymentNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-4 text-xs">
          {paymentNotice}
        </div>
      )}

      {pendingValidation && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-xs">
          Tu pago por transferencia o efectivo está <strong>Pendiente de Validación</strong>. Te
          avisaremos por correo cuando quede activo.
        </div>
      )}

      {showWelcome && (
        <div className="bg-gradient-to-r from-[#27366D] to-[#1e2b58] text-white rounded-xl p-6 shadow-lg border border-amber-400/30">
          <div className="flex items-start gap-3">
            <Sparkles className="w-6 h-6 text-amber-400 shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-black font-serif-cluster uppercase tracking-wide text-amber-400">
                ¡Ya eres Barrio!
              </h2>
              <p className="text-sm text-slate-200 mt-2 font-light">
                Bienvenido/a, <strong className="text-white">{user.nombre}</strong>. Ya formas parte
                oficial de la comunidad Barriando como miembro <strong>Vecino</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-black font-serif-cluster uppercase tracking-wide text-slate-950">
          {isVecino ? "Mi comunidad Barriando" : "Panel del socio"}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Bienvenido, {user.nombre} · Plan{" "}
          <strong className="text-[#27366D]">{getPlanLabel(subscription.plan)}</strong>
          {!isVecino && (
            <>
              {" "}
              · Estado{" "}
              <strong className={pendingValidation ? "text-amber-600" : "text-[#27366D]"}>
                {getSubscriptionStatusLabel(subscription.status)}
              </strong>
            </>
          )}
        </p>
      </div>

      {isVecino ? (
        <>
          <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-[#27366D] uppercase tracking-widest mb-2">
              Eres miembro oficial de la comunidad
            </h2>
            <p className="text-sm text-slate-600 font-light leading-relaxed">
              Como <strong>Vecino</strong> recibirás noticias, invitaciones a eventos y festivales del
              Centro Histórico. Para desbloquear herramientas comerciales —mapa, carrusel, blog y
              MUAAP— sube de nivel a cualquiera de los planes de pago.
            </p>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
              <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">
                Sube de nivel y desbloquea beneficios comerciales
              </h2>
              <ul className="mt-3 grid sm:grid-cols-2 gap-2">
                {COMMERCIAL_BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-2 p-4 border-b border-slate-100 bg-white">
              {PAID_PLANS.map((planId) => (
                <button
                  key={planId}
                  type="button"
                  onClick={() => setActiveTab(planId)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                    activeTab === planId
                      ? "bg-[#27366D] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {MEMBERSHIP_PLANS[planId].label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {(() => {
                const plan = MEMBERSHIP_PLANS[activeTab];
                const price = formatPlanPriceMxn(activeTab);
                return (
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                        {plan.tagline}
                      </p>
                      <h3 className="text-lg font-bold text-slate-950 mt-1">{plan.label}</h3>
                      <p className="text-2xl font-black text-[#27366D] mt-2">{price}</p>
                      {plan.highlight && (
                        <p className="text-xs text-amber-700 mt-1">{plan.highlight}</p>
                      )}
                      <p className="text-sm text-slate-600 mt-2 font-light">{plan.description}</p>
                    </div>
                    <ul className="space-y-2">
                      {plan.benefits.map((b) => (
                        <li key={b} className="flex items-start gap-2 text-xs text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-[#27366D] shrink-0 mt-0.5" />
                          {b}
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-col gap-3 pt-2">
                      {stripeConfigured ? (
                        <button
                          type="button"
                          onClick={() => handleStripePay(activeTab)}
                          className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-lg transition w-fit"
                        >
                          <CreditCard className="w-4 h-4" />
                          Pagar con Stripe
                        </button>
                      ) : null}
                      <TransferPaymentSection
                        plan={activeTab}
                        onConfirm={handleManualPayment}
                        disabled={pendingValidation}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
            {(payMsg || manualMsg) && (
              <p className="px-6 pb-4 text-xs text-slate-600">{payMsg || manualMsg}</p>
            )}
          </section>
        </>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-[#27366D]" />
              <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">Tu negocio</h2>
            </div>
            {catalogSocio || displayName ? (
              <div>
                <p className="font-bold text-slate-950">{displayName}</p>
                {catalogSocio && (
                  <p className="text-xs text-slate-500 mt-1">{catalogSocio.categoria}</p>
                )}
                <p className="text-xs text-amber-700 mt-2 font-bold">
                  Plan: {getPlanLabel(subscription.plan)}
                </p>
                {displayLogo && (
                  <div className="mt-4 h-24 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                    <img
                      src={displayLogo}
                      alt={displayName ?? "Logo"}
                      className="max-h-full max-w-full object-contain p-2"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                {canLink
                  ? "Vincula tu negocio en la sección de abajo para activar tu perfil comercial."
                  : "Cuando tu pago esté verificado podrás vincular tu negocio del catálogo oficial."}
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
              disabled={!commercial || !user.socioId || loading}
              className="text-xs w-full"
            />
            {!commercial && (
              <p className="text-xs text-amber-600 mt-2">
                Activa tu membresía de pago para subir tu logo al carrusel.
              </p>
            )}
            {logoMsg && <p className="text-xs mt-3 text-slate-600">{logoMsg}</p>}
          </section>

          {user.socioId && (
            <SocioProfileForm initial={profileDefaults} disabled={!user.socioId} />
          )}

          <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-4 h-4 text-[#27366D]" />
              <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">Membresía</h2>
            </div>
            <p className="text-sm text-slate-700 mb-2">
              Estado:{" "}
              <strong
                className={
                  commercial
                    ? "text-green-700"
                    : pendingValidation
                      ? "text-amber-600"
                      : "text-slate-500"
                }
              >
                {getSubscriptionStatusLabel(subscription.status)}
              </strong>
            </p>
            <p className="text-sm font-semibold text-[#27366D] mb-2">
              {formatPlanPriceMxn(subscription.plan as PaidMembershipPlan)} ·{" "}
              {getPlanLabel(subscription.plan)}
            </p>
            {subscription.currentPeriodEnd && (
              <p className="text-xs text-slate-500 mb-4">
                Próximo periodo hasta:{" "}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString("es-MX")}
              </p>
            )}
            <div className="flex flex-col gap-3">
              {stripeConfigured && (
                <button
                  onClick={() => handleStripePay(subscription.plan)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-lg transition w-fit"
                >
                  {subscription.status === "active" ? "Gestionar suscripción" : "Renovar con Stripe"}
                </button>
              )}
              {!commercial && subscription.plan !== "VECINO" && (
                <TransferPaymentSection
                  plan={subscription.plan}
                  onConfirm={handleManualPayment}
                  disabled={pendingValidation}
                />
              )}
            </div>
            {payMsg && <p className="text-xs mt-3 text-slate-600">{payMsg}</p>}
            {manualMsg && <p className="text-xs mt-3 text-slate-600">{manualMsg}</p>}
          </section>

          {!user.socioId && canLink && (
            <section className="bg-white border border-amber-200 rounded-xl p-6 shadow-sm md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <Link2 className="w-5 h-5 text-amber-600" />
                <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">
                  Vincula tu negocio
                </h2>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={linkSocioId}
                  onChange={(e) => setLinkSocioId(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs"
                >
                  <option value="">Selecciona tu negocio...</option>
                  {socios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.categoria}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleLinkSocio}
                  disabled={!linkSocioId || linkLoading}
                  className="bg-[#27366D] text-white font-bold text-xs uppercase px-6 py-3 rounded-lg disabled:opacity-50"
                >
                  {linkLoading ? "Vinculando..." : "Vincular"}
                </button>
              </div>
              {linkMsg && <p className="text-xs mt-3 text-slate-600">{linkMsg}</p>}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
