"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  COMMERCIAL_BENEFITS,
  MEMBERSHIP_PLANS,
  PAID_PLANS,
  formatPlanPriceMxn,
  getPlanLabel,
  getSubscriptionStatusLabel,
  getUpgradePlans,
  hasCommercialAccess,
  isTuristaPlan,
  canLinkSocioAccount,
  isSubscriptionStatusPending,
  type PaidMembershipPlan,
} from "@/lib/membresia";
import {
  formatRenewalDisplay,
  formatNextChargeDate,
  getRenewalMode,
  resolveMembershipExpiryLabel,
  safePlanPriceLabel,
} from "@/lib/panel-display";
import { getLinkageStatusLabel, isLinkageApproved, isLinkagePending, isLinkageRejected } from "@/lib/linkage";
import { reportManualPayment, cancelMembership } from "./actions";
import SocioProfileForm from "./SocioProfileForm";
import TransferPaymentSection from "./TransferPaymentSection";
import LinkSocioSection from "./LinkSocioSection";
import type { MembershipPlan } from "@/generated/prisma/client";
import {
  Building2,
  CreditCard,
  MapPin,
  Sparkles,
  Upload,
  CheckCircle2,
  Shield,
  ArrowUpCircle,
  X,
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
  isAdmin: boolean;
  subscription: {
    plan: MembershipPlan;
    status: string;
    currentPeriodEnd: string | null;
    stripeSubscriptionId: string | null;
    createdAt: string | null;
  };
  socioProfile: {
    businessName: string;
    website: string;
    googleBusinessUrl: string;
    logoUrl: string;
    linkageStatus: string;
    isManualEntry: boolean;
    address: string;
    category: string;
    rfc: string;
    razonSocial: string;
    regimenFiscal: string;
    usoCfdi: string;
    billingStreet: string;
    billingColonia: string;
    billingCiudad: string;
    billingEstado: string;
    billingPais: string;
    billingCodigoPostal: string;
    billingAddressFull: string;
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
  hasPaidAccess: boolean;
  paymentNotice?: string | null;
  socios: SocioOption[];
  takenSocioIds?: number[];
  paymentDetails: {
    clabe: string;
    bankLabel: string;
    paymentEmail: string;
  };
}

export default function PanelDashboard({
  user,
  isAdmin,
  subscription,
  socioProfile,
  catalogSocio,
  stripeConfigured,
  showWelcome,
  hasPaidAccess,
  paymentNotice,
  socios = [],
  takenSocioIds = [],
  paymentDetails,
}: PanelProps) {
  const router = useRouter();
  const { update } = useSession();
  const [activeTab, setActiveTab] = useState<PaidMembershipPlan>("NEGOCIO_FAMILIAR");
  const [logoMsg, setLogoMsg] = useState("");
  const [payMsg, setPayMsg] = useState("");
  const [manualMsg, setManualMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [cancelMsg, setCancelMsg] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [dismissedNotice, setDismissedNotice] = useState(false);
  const [localPaymentNotice, setLocalPaymentNotice] = useState<string | null>(null);

  const plan = subscription?.plan ?? "TURISTA";
  const status = subscription?.status ?? "inactive";

  const isTurista = isTuristaPlan(plan);
  const commercial = hasCommercialAccess(plan, status);
  const canLink = canLinkSocioAccount(status);
  const pendingValidation = isSubscriptionStatusPending(status);
  const paymentRejected = status === "manual_rejected";
  const expiryLabel = resolveMembershipExpiryLabel({
    status,
    currentPeriodEnd: subscription?.currentPeriodEnd,
    subscriptionCreatedAt: subscription?.createdAt,
    stripeSubscriptionId: subscription?.stripeSubscriptionId,
  });
  const renewalLabel = formatRenewalDisplay(status, subscription?.stripeSubscriptionId);
  const upgradePlans =
    commercial && !isTurista ? getUpgradePlans(plan) : [];

  const linkagePending = isLinkagePending(socioProfile?.linkageStatus);
  const linkageApproved = isLinkageApproved(socioProfile?.linkageStatus);
  const linkageRejected = isLinkageRejected(socioProfile?.linkageStatus);
  const hasBusinessLinked = Boolean(user.socioId && linkageApproved);
  const showLinkSection = canLink && !user.socioId && !linkagePending;
  const showLinkageFirst = canLink && !user.socioId && !linkagePending && !linkageApproved;
  const autoRenewal =
    getRenewalMode(status, subscription?.stripeSubscriptionId) === "automatic";
  const nextChargeDate = formatNextChargeDate(subscription?.currentPeriodEnd);

  const displayName =
    socioProfile?.businessName || catalogSocio?.name || (linkagePending ? "Solicitud en revisión" : null);
  const displayLogo = socioProfile?.logoUrl || (catalogSocio ? `/logos/${catalogSocio.foto}.png` : null);

  const profileDefaults = {
    businessName: socioProfile?.businessName ?? catalogSocio?.name ?? "",
    website: socioProfile?.website ?? catalogSocio?.url ?? "",
    googleBusinessUrl: socioProfile?.googleBusinessUrl ?? catalogSocio?.direccion ?? "",
    rfc: socioProfile?.rfc ?? "",
    razonSocial: socioProfile?.razonSocial ?? "",
    regimenFiscal: socioProfile?.regimenFiscal ?? "",
    usoCfdi: socioProfile?.usoCfdi ?? "",
    billingStreet: socioProfile?.billingStreet ?? "",
    billingColonia: socioProfile?.billingColonia ?? "",
    billingCiudad: socioProfile?.billingCiudad ?? "",
    billingEstado: socioProfile?.billingEstado ?? "",
    billingPais: socioProfile?.billingPais ?? "México",
    billingCodigoPostal: socioProfile?.billingCodigoPostal ?? "",
    billingAddressFull: socioProfile?.billingAddressFull ?? "",
  };

  async function refreshSession() {
    await update();
    router.refresh();
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

  async function handleCancelMembership() {
    if (!confirm("¿Cancelar tu membresía? Seguirás con acceso hasta el fin del periodo facturado.")) {
      return;
    }
    setCancelMsg("");
    setCancelLoading(true);
    const result = await cancelMembership();
    setCancelLoading(false);
    if (!result.ok) {
      setCancelMsg(result.error);
      return;
    }
    setCancelMsg(result.message);
    await refreshSession();
  }

  const stripeButtonLabel = commercial ? "Renovar Membresía" : "Pagar de forma Segura";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pago = params.get("pago");
    const success = params.get("success");

    if (pago === "exitoso" || pago === "procesando" || success === "true") {
      setLocalPaymentNotice(
        hasPaidAccess
          ? "¡Pago confirmado! Ya puedes vincular tu negocio certificado y usar las herramientas comerciales."
          : "Recibimos tu pago. Estamos activando tu membresía; en unos segundos tendrás acceso completo. Si no cambia, recarga esta página."
      );
    } else if (pago === "cancelado" && !hasPaidAccess) {
      setLocalPaymentNotice("Pago cancelado. Puedes intentar de nuevo cuando quieras desde tu panel.");
    } else if (pago === "stripe_no_configurado") {
      setLocalPaymentNotice("Stripe no está configurado aún. Contacta al equipo de Barriando.");
    }

    params.delete("pago");
    params.delete("bienvenida");
    params.delete("success");
    const qs = params.toString();
    window.history.replaceState(
      null,
      "",
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname
    );
  }, [hasPaidAccess]);

  const activePaymentNotice = localPaymentNotice ?? paymentNotice;

  return (
    <div className="space-y-6">
      {activePaymentNotice && !dismissedNotice && (
        <div className="relative bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-4 pr-10 text-xs">
          <button
            type="button"
            onClick={() => setDismissedNotice(true)}
            className="absolute top-3 right-3 text-emerald-700 hover:text-emerald-900 transition"
            aria-label="Cerrar aviso"
          >
            <X className="w-4 h-4" />
          </button>
          {activePaymentNotice}
        </div>
      )}

      {pendingValidation && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-xs">
          Tu pago por transferencia o efectivo está <strong>Pendiente de Validación</strong>. Te
          avisaremos por correo cuando quede activo.
        </div>
      )}

      {(paymentRejected || linkageRejected) && (
        <div className="bg-red-50 border border-red-200 text-red-900 rounded-xl p-4 text-xs leading-relaxed">
          Tu {paymentRejected && linkageRejected ? "pago y vinculación" : paymentRejected ? "pago" : "vinculación"} no
          fue aprobado por el administrador. Por favor, verifica tus datos y reenvía la solicitud.
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

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black font-serif-cluster uppercase tracking-wide text-slate-950">
            {isTurista ? "Mi comunidad Barriando" : "Panel del socio"}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Bienvenido, {user.nombre} · Plan{" "}
            <strong className="text-[#27366D]">{getPlanLabel(plan)}</strong>
            {!isTurista && (
              <>
                {" "}
                · Estado{" "}
                <strong className={pendingValidation ? "text-amber-600" : "text-[#27366D]"}>
                  {getSubscriptionStatusLabel(status)}
                </strong>
              </>
            )}
          </p>
        </div>
        {isAdmin && (
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 bg-[#27366D] hover:bg-[#1e2b58] text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition shrink-0"
          >
            <Shield className="w-4 h-4" />
            Panel Admin
          </Link>
        )}
      </div>

      {isTurista ? (
        <>
          <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-[#27366D] uppercase tracking-widest mb-2">
              Eres miembro oficial de la comunidad
            </h2>
            <p className="text-sm text-slate-600 font-light leading-relaxed">
              Como <strong>Turista</strong> recibirás novedades del Centro Histórico y acceso al Pasaporte MAP.
              Para desbloquear herramientas comerciales —mapa, carrusel, blog y rutas oficiales— elige un plan de socio.
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
                          Pagar de forma Segura
                        </button>
                      ) : null}
                      <TransferPaymentSection
                        plan={activeTab}
                        onConfirm={handleManualPayment}
                        disabled={pendingValidation}
                        clabe={paymentDetails.clabe}
                        bankLabel={paymentDetails.bankLabel}
                        paymentEmail={paymentDetails.paymentEmail}
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
      ) : showLinkageFirst ? (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-sm text-emerald-900">
            <p className="font-bold mb-1">¡Pago verificado! Siguiente paso: vincula tu negocio</p>
            <p className="text-xs font-light leading-relaxed">
              Tu membresía está activa. Completa la vinculación para aparecer en el directorio y rutas MAP.
            </p>
          </div>
          <LinkSocioSection
            socios={socios ?? []}
            takenSocioIds={takenSocioIds ?? []}
            onLinked={refreshSession}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {showLinkSection && (
            <LinkSocioSection
              socios={socios ?? []}
              takenSocioIds={takenSocioIds ?? []}
              onLinked={refreshSession}
            />
          )}

          {linkagePending && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-xs">
              Tu vinculación está <strong>Pendiente de aprobación</strong>. Un administrador revisará tu
              solicitud antes de activar tu perfil público.
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-4 h-4 text-[#27366D]" />
                <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">Tu negocio</h2>
              </div>
              {hasBusinessLinked || displayName ? (
                <div>
                  <p className="font-bold text-slate-950">{displayName}</p>
                  {(catalogSocio?.categoria || socioProfile?.category) && (
                    <p className="text-xs text-slate-500 mt-1">
                      {socioProfile?.category || catalogSocio?.categoria}
                    </p>
                  )}
                  {socioProfile?.address && (
                    <p className="text-xs text-slate-500 mt-1">{socioProfile.address}</p>
                  )}
                  {socioProfile?.linkageStatus && (
                    <p
                      className={`text-xs mt-2 font-bold ${
                        linkageApproved ? "text-green-700" : linkagePending ? "text-amber-600" : "text-red-600"
                      }`}
                    >
                      Estado: {getLinkageStatusLabel(socioProfile.linkageStatus as "pending" | "approved" | "rejected")}
                    </p>
                  )}
                  <p className="text-xs text-amber-700 mt-2 font-bold">
                    Plan: {getPlanLabel(plan)}
                  </p>
                  {displayLogo && linkageApproved && (
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
                    ? "Usa el buscador de arriba para vincular o registrar tu negocio."
                    : "Cuando tu pago esté verificado podrás vincular tu negocio."}
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
                disabled={!commercial || !linkageApproved || loading}
                className="text-xs w-full"
              />
              {!linkageApproved && hasBusinessLinked && (
                <p className="text-xs text-amber-600 mt-2">
                  Podrás subir tu logo cuando el administrador apruebe tu vinculación.
                </p>
              )}
              {!commercial && (
                <p className="text-xs text-amber-600 mt-2">
                  Activa tu membresía de pago para subir tu logo al carrusel.
                </p>
              )}
              {logoMsg && <p className="text-xs mt-3 text-slate-600">{logoMsg}</p>}
            </section>

            {(user.socioId || socioProfile?.businessName) && linkageApproved && (
              <SocioProfileForm initial={profileDefaults} disabled={!linkageApproved} />
            )}

            <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm md:col-span-2 relative">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#27366D]" />
                  <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">Membresía</h2>
                </div>
                {commercial && !isTurista && (
                  <button
                    type="button"
                    disabled={cancelLoading}
                    onClick={handleCancelMembership}
                    className="text-[10px] text-slate-400 hover:text-red-600 underline underline-offset-2 transition shrink-0"
                  >
                    Cancelar membresía
                  </button>
                )}
              </div>
              <p className="text-sm text-slate-700 mb-1">
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
                  {getSubscriptionStatusLabel(status)}
                </strong>
              </p>
              <p className="text-sm font-semibold text-[#27366D] mb-2">
                {safePlanPriceLabel(plan)} · {getPlanLabel(plan)}
              </p>
              <p className="text-sm text-slate-700 mb-1">
                Vencimiento: <strong className="text-slate-900">{expiryLabel}</strong>
              </p>
              <p className="text-xs text-slate-500 mb-4">
                Tipo de renovación: <strong className="text-[#27366D]">{renewalLabel}</strong>
              </p>

              {autoRenewal && nextChargeDate && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-xs text-emerald-900">
                  Tu renovación automática está activa. Tu próximo cargo será el{" "}
                  <strong>{nextChargeDate}</strong>.
                </div>
              )}

              <div className="flex flex-col gap-3">
                {stripeConfigured && !autoRenewal && (
                  <button
                    type="button"
                    onClick={() => handleStripePay(plan)}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-lg transition w-fit"
                  >
                    {stripeButtonLabel}
                  </button>
                )}
                {!commercial && plan !== "TURISTA" && (
                  <TransferPaymentSection
                    plan={plan}
                    onConfirm={handleManualPayment}
                    disabled={pendingValidation}
                    clabe={paymentDetails.clabe}
                    bankLabel={paymentDetails.bankLabel}
                    paymentEmail={paymentDetails.paymentEmail}
                  />
                )}
              </div>
              {upgradePlans.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <ArrowUpCircle className="w-4 h-4 text-amber-600" />
                    <h3 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">
                      Upgrade a plan superior
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {upgradePlans.map((planId) => (
                      <div
                        key={planId}
                        className="border border-slate-200 rounded-lg p-4 bg-slate-50 min-w-[10rem]"
                      >
                        <p className="font-bold text-slate-900 text-sm">{MEMBERSHIP_PLANS[planId].label}</p>
                        <p className="text-xs text-[#27366D] font-semibold mt-1">
                          {formatPlanPriceMxn(planId)}
                        </p>
                        {stripeConfigured && (
                          <button
                            type="button"
                            onClick={() => handleStripePay(planId)}
                            className="mt-3 text-[10px] font-bold uppercase tracking-wider bg-[#27366D] text-white px-3 py-2 rounded-lg hover:bg-[#1e2b58] transition"
                          >
                            Upgrade
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {payMsg && <p className="text-xs mt-3 text-slate-600">{payMsg}</p>}
              {manualMsg && <p className="text-xs mt-3 text-slate-600">{manualMsg}</p>}
              {cancelMsg && <p className="text-xs mt-3 text-slate-600">{cancelMsg}</p>}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
