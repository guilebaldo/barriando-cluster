"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowUpCircle, CreditCard } from "lucide-react";
import {
  formatNextChargeDate,
  formatRenewalDisplay,
  getRenewalMode,
  resolveMembershipExpiryLabel,
  safePlanPriceLabel,
} from "@/lib/panel-display";
import {
  MEMBERSHIP_PLANS,
  formatPlanPriceMxn,
  getPlanLabel,
  getSubscriptionStatusLabel,
  getUpgradePlans,
  hasCommercialAccess,
  isSubscriptionStatusPending,
} from "@/lib/membresia";
import { planToSlug } from "@/lib/plan-routing";
import type { MembershipPlan } from "@/generated/prisma/client";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import BenefitCredentialCard from "./BenefitCredentialCard";
import MembershipPaymentOptions from "@/app/components/MembershipPaymentOptions";
import { cancelMembership, reportManualPayment } from "./actions";

type VecinoPanelProps = {
  user: {
    nombre: string;
    email: string;
    image: string | null;
  };
  subscription: {
    plan: MembershipPlan;
    status: string;
    currentPeriodEnd: string | null;
    hasStripeSubscription: boolean;
    createdAt: string | null;
  };
  showCredential: boolean;
  stripeConfigured: boolean;
  paymentDetails: {
    clabe: string;
    bankLabel: string;
    paymentEmail: string;
  };
};

export default function VecinoPanel({
  user,
  subscription,
  showCredential,
  stripeConfigured,
  paymentDetails,
}: VecinoPanelProps) {
  const router = useRouter();
  const { update } = useSession();
  const [payMsg, setPayMsg] = useState("");
  const [manualMsg, setManualMsg] = useState("");
  const [cancelMsg, setCancelMsg] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const paidActive = hasCommercialAccess(subscription.plan, subscription.status);
  const pendingValidation = isSubscriptionStatusPending(subscription.status);
  const upgradePlans = paidActive ? getUpgradePlans(subscription.plan) : [];
  const expiryLabel = resolveMembershipExpiryLabel({
    status: subscription.status,
    currentPeriodEnd: subscription.currentPeriodEnd,
    subscriptionCreatedAt: subscription.createdAt,
    stripeSubscriptionId: subscription.hasStripeSubscription,
  });
  const renewalLabel = formatRenewalDisplay(subscription.status, subscription.hasStripeSubscription);
  const nextChargeDate = formatNextChargeDate(subscription.currentPeriodEnd);
  const autoRenewal =
    getRenewalMode(subscription.status, subscription.hasStripeSubscription) === "automatic";

  async function refreshSession() {
    await update();
    router.refresh();
  }

  async function handleStripePay(plan: MembershipPlan) {
    setPayMsg("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, method: "card" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo iniciar el pago con tarjeta");
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("Stripe no devolvió una URL de pago.");
    } catch (err) {
      setPayMsg(err instanceof Error ? err.message : "Error al iniciar pago");
    }
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

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.nombre}
              width={64}
              height={64}
              className="rounded-full border-2 border-amber-400/40 object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#27366D]/10 flex items-center justify-center text-[#27366D] font-bold text-xl">
              {user.nombre.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-slate-950">{user.nombre}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mt-2">
              Vecino certificado
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#27366D]" />
            <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">
              Estado de membresía
            </h2>
          </div>
          {paidActive && (
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
          Plan <strong className="text-[#27366D]">{getPlanLabel(subscription.plan)}</strong>
        </p>
        <p className="text-sm text-slate-700 mb-1">
          Estado:{" "}
          <strong className="text-green-700">{getSubscriptionStatusLabel(subscription.status)}</strong>
        </p>
        <p className="text-sm font-semibold text-[#27366D] mb-2">
          {safePlanPriceLabel(subscription.plan)}
        </p>
        <p className="text-sm text-slate-700 mb-1">
          Vigencia: <strong className="text-slate-900">{expiryLabel}</strong>
        </p>
        <p className="text-xs text-slate-500 mb-3">
          Renovación: <strong className="text-[#27366D]">{renewalLabel}</strong>
        </p>
        {autoRenewal && nextChargeDate && (
          <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-3">
            Próximo pago: <strong>{nextChargeDate}</strong>
          </p>
        )}

        {!autoRenewal && (
          <MembershipPaymentOptions
            plan={subscription.plan}
            stripeConfigured={stripeConfigured}
            disabled={pendingValidation}
            onStripePay={() => void handleStripePay(subscription.plan)}
            onManualConfirm={handleManualPayment}
            paymentDetails={paymentDetails}
            showOxxo
            showTransfer
            stripeLabel="Domiciliar con tarjeta"
          />
        )}

        {upgradePlans.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpCircle className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">
                Upgrade a plan de negocio
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 font-light mb-3 leading-relaxed">
              Al subir a un plan comercial podrás vincular tu negocio al directorio y al MAPA desde este
              mismo panel.
            </p>
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
                  {stripeConfigured ? (
                    <button
                      type="button"
                      onClick={() => void handleStripePay(planId)}
                      className="mt-3 text-[10px] font-bold uppercase tracking-wider bg-[#27366D] text-white px-3 py-2 rounded-lg hover:bg-[#1e2b58] transition"
                    >
                      Upgrade
                    </button>
                  ) : (
                    <Link
                      href={`/planes?cambio=1&plan=${planToSlug(planId)}`}
                      className="mt-3 inline-block text-[10px] font-bold uppercase tracking-wider bg-[#27366D] text-white px-3 py-2 rounded-lg hover:bg-[#1e2b58] transition"
                    >
                      Ver plan
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(payMsg || manualMsg) && (
          <p className="text-xs mt-3 text-slate-600">{payMsg || manualMsg}</p>
        )}
        {cancelMsg && <p className="text-xs mt-3 text-slate-600">{cancelMsg}</p>}
      </section>

      {showCredential && (
        <BenefitCredentialCard
          userName={user.nombre}
          plan={subscription.plan}
          expiryLabel={expiryLabel}
        />
      )}

      <ConfirmDialog
        open={showCancelDialog}
        title="Cancelar membresía"
        message="¿Cancelar tu membresía Vecino? Seguirás con acceso hasta el fin del periodo facturado."
        confirmLabel="Sí, cancelar"
        cancelLabel="Volver"
        loading={cancelLoading}
        onConfirm={() => void handleCancelMembership()}
        onCancel={() => setShowCancelDialog(false)}
      />
    </div>
  );
}
