"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  MEMBERSHIP_PLANS,
  formatPlanPriceMxn,
  getPlanLabel,
  getSubscriptionStatusLabel,
  getUpgradePlans,
  hasCommercialAccess,
  isTuristaPlan,
  isVecinoPlan,
  isBusinessPlan,
  canLinkSocioAccount,
  isSubscriptionStatusPending,
  isTransferPaymentPending,
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
import ConfirmDialog from "@/app/components/ConfirmDialog";
import {
  hasSeenPanelNotice,
  markPanelNoticeSeen,
} from "@/lib/panel-notices-storage";
import { reportManualPayment, cancelMembership } from "./actions";
import SocioProfileForm from "./SocioProfileForm";
import TransferPaymentSection from "./TransferPaymentSection";
import LinkSocioSection from "./LinkSocioSection";
import TouristPanel from "./TouristPanel";
import VecinoPanel from "./VecinoPanel";
import SocioBenefitForm from "./SocioBenefitForm";
import EstablishmentQrDownload from "./EstablishmentQrDownload";
import BenefitCredentialCard from "./BenefitCredentialCard";
import type { MembershipPlan } from "@/generated/prisma/client";
import {
  Building2,
  CreditCard,
  Sparkles,
  Upload,
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
    image: string | null;
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
    id: string;
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
    latitude: number | null;
    longitude: number | null;
    offersBenefit: boolean;
    benefitTitle: string;
    benefitDescription: string;
    benefitHowToRedeem: string;
    benefitValidFrom: string | null;
    benefitValidUntil: string | null;
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
  totalMilestones: number;
  milestonesVisited: number;
  showCredential?: boolean;
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
  totalMilestones,
  milestonesVisited,
  showCredential = false,
}: PanelProps) {
  const router = useRouter();
  const { update } = useSession();
  const [payMsg, setPayMsg] = useState("");
  const [manualMsg, setManualMsg] = useState("");
  const [cancelMsg, setCancelMsg] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [dismissedNotice, setDismissedNotice] = useState(() =>
    hasSeenPanelNotice(user.id, "payment_confirmed")
  );
  const [localPaymentNotice, setLocalPaymentNotice] = useState<string | null>(null);
  const [linkageCtaSeen, setLinkageCtaSeen] = useState(() =>
    hasSeenPanelNotice(user.id, "linkage_cta")
  );
  const [paymentRejectedDismissed, setPaymentRejectedDismissed] = useState(() =>
    hasSeenPanelNotice(user.id, "payment_rejected")
  );
  const [linkageRejectedDismissed, setLinkageRejectedDismissed] = useState(() =>
    hasSeenPanelNotice(user.id, "linkage_rejected")
  );
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const plan = subscription?.plan ?? "TURISTA";
  const status = subscription?.status ?? "inactive";

  const isTurista = isTuristaPlan(plan);
  const isVecino = isVecinoPlan(plan);
  const isBusiness = isBusinessPlan(plan);
  const commercial = hasCommercialAccess(plan, status);
  const canLink = canLinkSocioAccount(status);
  const pendingValidation = isSubscriptionStatusPending(status);
  const transferPending = isTransferPaymentPending(status);
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
  const hasBusinessEstablished =
    linkageApproved && Boolean(user.socioId || socioProfile?.businessName?.trim());
  const hasBusinessLinked = Boolean(user.socioId && linkageApproved);
  const showLinkSection = canLink && !hasBusinessEstablished && !linkagePending;
  const showLinkageFirst = canLink && !hasBusinessEstablished && !linkagePending && !linkageApproved;
  const autoRenewal =
    getRenewalMode(status, subscription?.stripeSubscriptionId) === "automatic";
  const nextChargeDate = formatNextChargeDate(subscription?.currentPeriodEnd);

  const displayName =
    socioProfile?.businessName || catalogSocio?.name || (linkagePending ? "Solicitud en revisión" : null);
  const displayLogo = socioProfile?.logoUrl || (catalogSocio ? `/logos/${catalogSocio.foto}.png` : null);

  const profileDefaults = {
    businessName: socioProfile?.businessName ?? catalogSocio?.name ?? "",
    website: socioProfile?.website ?? catalogSocio?.url ?? "",
    googleBusinessUrl: socioProfile?.googleBusinessUrl ?? "",
    category: socioProfile?.category ?? catalogSocio?.categoria ?? "",
    address: socioProfile?.address ?? catalogSocio?.direccion ?? "",
    latitude: socioProfile?.latitude ?? null,
    longitude: socioProfile?.longitude ?? null,
    rfc: socioProfile?.rfc ?? "",
    razonSocial: socioProfile?.razonSocial ?? "",
    regimenFiscal: socioProfile?.regimenFiscal ?? "",
    usoCfdi: socioProfile?.usoCfdi ?? "",
    billingStreet: socioProfile?.billingStreet ?? "",
    billingColonia: socioProfile?.billingColonia ?? "",
    billingCiudad: socioProfile?.billingCiudad ?? "",
    billingEstado: socioProfile?.billingEstado ?? "",
    billingPais: socioProfile?.billingPais ?? "",
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

  async function handleCancelMembership() {
    setCancelMsg("");
    setCancelLoading(true);
    const result = await cancelMembership();
    setCancelLoading(false);
    setShowCancelDialog(false);
    if (!result.ok) {
      setCancelMsg(result.error);
      return;
    }
    setCancelMsg(result.message);
    await refreshSession();
  }

  const stripeButtonLabel = commercial ? "Domiciliar membresía" : "Pagar con tarjeta bancaria";

  useEffect(() => {
    if (hasBusinessEstablished) {
      markPanelNoticeSeen(user.id, "payment_confirmed");
      markPanelNoticeSeen(user.id, "linkage_cta");
      setDismissedNotice(true);
      setLinkageCtaSeen(true);
    }
  }, [hasBusinessEstablished, user.id]);

  useEffect(() => {
    if (hasSeenPanelNotice(user.id, "payment_confirmed")) {
      return;
    }

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
  }, [hasPaidAccess, user.id]);

  function dismissPaymentNotice() {
    markPanelNoticeSeen(user.id, "payment_confirmed");
    setDismissedNotice(true);
  }

  const activePaymentNotice = localPaymentNotice ?? paymentNotice;
  const showTransferPendingBanner = transferPending && !linkageApproved;
  const showLinkageCtaBanner = showLinkageFirst && !linkageCtaSeen;
  const suppressTopPaymentNotice =
    dismissedNotice || showLinkageCtaBanner || hasBusinessEstablished;

  return (
    <div className="space-y-6">
      {activePaymentNotice && !suppressTopPaymentNotice && (
        <div className="relative bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-4 pr-10 text-xs">
          <button
            type="button"
            onClick={dismissPaymentNotice}
            className="absolute top-3 right-3 text-emerald-700 hover:text-emerald-900 transition"
            aria-label="Cerrar aviso"
          >
            <X className="w-4 h-4" />
          </button>
          {activePaymentNotice}
        </div>
      )}

      {showTransferPendingBanner && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-sm">
          <p className="font-bold text-[#27366D] mb-1">Pago pendiente de revisión</p>
          <p className="text-xs font-light leading-relaxed">
            Tu pago por transferencia está siendo revisado por el administrador. Una vez confirmado, se
            habilitarán las herramientas para dar de alta o vincular tu negocio.
          </p>
        </div>
      )}

      {(paymentRejected || linkageRejected) && (
        <>
          {paymentRejected && !paymentRejectedDismissed && (
            <div className="relative bg-red-50 border border-red-200 text-red-900 rounded-xl p-4 text-xs leading-relaxed">
              <button
                type="button"
                onClick={() => {
                  markPanelNoticeSeen(user.id, "payment_rejected");
                  setPaymentRejectedDismissed(true);
                }}
                className="absolute top-3 right-3 text-red-700 hover:text-red-900"
                aria-label="Cerrar aviso"
              >
                <X className="w-4 h-4" />
              </button>
              <p className="font-bold mb-1 pr-6">Tu pago fue rechazado</p>
              <p>
                Intenta de nuevo con otro método de pago o reenvía la foto de tu comprobante a{" "}
                <a href="mailto:guilebaldoruiz@gmail.com" className="underline font-semibold">
                  guilebaldoruiz@gmail.com
                </a>
                .
              </p>
            </div>
          )}
          {linkageRejected && !linkageRejectedDismissed && (
            <div className="relative bg-red-50 border border-red-200 text-red-900 rounded-xl p-4 text-xs leading-relaxed">
              <button
                type="button"
                onClick={() => {
                  markPanelNoticeSeen(user.id, "linkage_rejected");
                  setLinkageRejectedDismissed(true);
                }}
                className="absolute top-3 right-3 text-red-700 hover:text-red-900"
                aria-label="Cerrar aviso"
              >
                <X className="w-4 h-4" />
              </button>
              <p className="font-bold mb-1 pr-6">Tu vinculación o alta fue rechazada</p>
              <p>
                Revisa los datos y vuelve a enviar la solicitud con la información correcta. Si necesitas
                ayuda, escribe a{" "}
                <a href="mailto:guilebaldoruiz@gmail.com" className="underline font-semibold">
                  guilebaldoruiz@gmail.com
                </a>
                .
              </p>
            </div>
          )}
        </>
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
                oficial de la comunidad Barriando como{" "}
                <strong>{isTurista ? "Turista" : getPlanLabel(plan)}</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black font-serif-cluster uppercase tracking-wide text-slate-950">
            {isTurista ? "Mi comunidad Barriando" : isVecino ? "Panel del vecino" : "Panel del socio"}
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
        <TouristPanel
          user={{
            nombre: user.nombre,
            email: user.email,
            image: user.image,
          }}
          milestonesVisited={milestonesVisited}
          totalMilestones={totalMilestones}
        />
      ) : isVecino ? (
        <VecinoPanel
          user={{
            nombre: user.nombre,
            email: user.email,
            image: user.image,
          }}
          subscription={subscription}
          showCredential={showCredential}
        />
      ) : transferPending && !canLink ? (
        <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-[#27366D]" />
            <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">Membresía</h2>
          </div>
          <p className="text-sm text-slate-700 mb-1">
            Plan <strong className="text-[#27366D]">{getPlanLabel(plan)}</strong>
          </p>
          <p className="text-sm text-slate-700">
            Estado:{" "}
            <strong className="text-amber-600">{getSubscriptionStatusLabel(status)}</strong>
          </p>
          <p className="text-xs text-slate-500 mt-3 font-light">
            Te avisaremos por correo cuando confirmemos tu pago.
          </p>
        </section>
      ) : showLinkageFirst ? (
        <div className="space-y-6">
          {showLinkageCtaBanner && (
            <div className="relative bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-sm text-emerald-900">
              <button
                type="button"
                onClick={() => {
                  markPanelNoticeSeen(user.id, "linkage_cta");
                  markPanelNoticeSeen(user.id, "payment_confirmed");
                  setLinkageCtaSeen(true);
                  setDismissedNotice(true);
                }}
                className="absolute top-3 right-3 text-emerald-700 hover:text-emerald-900 transition"
                aria-label="Cerrar aviso"
              >
                <X className="w-4 h-4" />
              </button>
              <p className="font-bold mb-1 pr-6">¡Pago confirmado! Siguiente paso: vincula tu negocio</p>
              <p className="text-xs font-light leading-relaxed">
                Tu membresía está activa. Completa la vinculación para aparecer en el directorio y rutas MAP.
              </p>
            </div>
          )}
          <LinkSocioSection
            socios={socios ?? []}
            takenSocioIds={takenSocioIds ?? []}
            onLinked={refreshSession}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {showCredential && commercial && (
            <BenefitCredentialCard
              userName={user.nombre}
              plan={plan}
              expiryLabel={expiryLabel}
            />
          )}
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

          {hasBusinessEstablished && (
            <section className="bg-white border border-emerald-200 rounded-xl p-6 shadow-sm md:col-span-2">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#27366D]" />
                  <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">
                    Vista de control del negocio
                  </h2>
                </div>
                <div className="flex flex-wrap gap-3 text-xs">
                  <span className="text-amber-700 font-bold">Plan: {getPlanLabel(plan)}</span>
                  <span className="text-green-700 font-bold">Estado: Verificado</span>
                </div>
              </div>

              <div className="mb-6 flex flex-wrap items-start gap-6">
                <div className="h-28 w-44 shrink-0 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {displayLogo ? (
                    <img
                      src={displayLogo}
                      alt={displayName ?? "Logo"}
                      className="max-h-full max-w-full object-contain p-2"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <Building2 className="w-10 h-10 text-slate-300" aria-hidden />
                  )}
                </div>
                <div className="flex-1 min-w-[12rem] max-w-md">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Logotipo
                  </p>
                  <p className="text-xs text-slate-500 mb-3 font-light leading-relaxed">
                    La actualización de logotipo estará disponible próximamente. Por ahora se muestra el del
                    catálogo oficial o el que registraste al vincular tu negocio.
                  </p>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled
                    className="text-xs w-full opacity-40 cursor-not-allowed"
                    aria-disabled
                  />
                  <p className="text-[10px] text-amber-700 mt-2 font-medium">Próximamente habilitado</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <SocioProfileForm
                  initial={profileDefaults}
                  email={user.email}
                  disabled={!linkageApproved}
                  hideBusinessName={plan === "VECINO"}
                  embedded
                />
              </div>
            </section>
          )}

          {hasBusinessEstablished && isBusiness && commercial && socioProfile && (
            <>
              <SocioBenefitForm
                initial={{
                  offersBenefit: socioProfile.offersBenefit,
                  benefitTitle: socioProfile.benefitTitle,
                  benefitDescription: socioProfile.benefitDescription,
                  benefitHowToRedeem: socioProfile.benefitHowToRedeem,
                  benefitValidFrom: socioProfile.benefitValidFrom,
                  benefitValidUntil: socioProfile.benefitValidUntil,
                }}
                onSaved={refreshSession}
              />
              <EstablishmentQrDownload
                socioId={user.socioId}
                businessName={displayName ?? socioProfile.businessName}
              />
            </>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {!hasBusinessEstablished && (
            <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-4 h-4 text-[#27366D]" />
                <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">Tu negocio</h2>
              </div>
              {displayName ? (
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
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  {canLink
                    ? "Usa el buscador de arriba para vincular o registrar tu negocio."
                    : "Cuando tu pago esté verificado podrás vincular tu negocio."}
                </p>
              )}
            </section>
            )}

            {!hasBusinessEstablished && (
            <section className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-sm opacity-90">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="w-4 h-4 text-slate-400" />
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Actualizar logo</h2>
              </div>
              <p className="text-xs text-slate-500 mb-3 font-light leading-relaxed">
                La actualización de logotipo estará disponible próximamente. Por ahora tu logo se muestra desde
                el catálogo oficial o el que registraste al vincular tu negocio.
              </p>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled
                className="text-xs w-full opacity-40 cursor-not-allowed"
                aria-disabled
              />
              <p className="text-[10px] text-amber-700 mt-2 font-medium">Próximamente habilitado</p>
            </section>
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
                    onClick={() => setShowCancelDialog(true)}
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
                        className="border border-slate-200 rounded-lg p-4 bg-slate-50 min-w-[10rem] flex-1"
                      >
                        <p className="font-bold text-slate-900 text-sm">{MEMBERSHIP_PLANS[planId].label}</p>
                        <p className="text-xs text-[#27366D] font-semibold mt-1">
                          {formatPlanPriceMxn(planId)}
                        </p>
                        <ul className="mt-2 space-y-1">
                          {MEMBERSHIP_PLANS[planId].benefits.slice(0, 3).map((b) => (
                            <li key={b} className="text-[10px] text-slate-600 leading-snug">
                              · {b}
                            </li>
                          ))}
                        </ul>
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
      <ConfirmDialog
        open={showCancelDialog}
        title="Cancelar membresía"
        message="¿Cancelar tu membresía? Seguirás con acceso hasta el fin del periodo facturado."
        confirmLabel="Sí, cancelar"
        cancelLabel="Volver"
        loading={cancelLoading}
        onConfirm={handleCancelMembership}
        onCancel={() => setShowCancelDialog(false)}
      />
    </div>
  );
}
