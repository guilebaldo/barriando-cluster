"use client";

import Image from "next/image";
import Link from "next/link";
import { CreditCard, Gift } from "lucide-react";
import {
  formatNextChargeDate,
  formatRenewalDisplay,
  getRenewalMode,
  resolveMembershipExpiryLabel,
  safePlanPriceLabel,
} from "@/lib/panel-display";
import { getPlanLabel, getSubscriptionStatusLabel } from "@/lib/membresia";
import type { MembershipPlan } from "@/generated/prisma/client";
import BenefitCredentialCard from "./BenefitCredentialCard";

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
    stripeSubscriptionId: string | null;
    createdAt: string | null;
  };
  showCredential: boolean;
};

export default function VecinoPanel({ user, subscription, showCredential }: VecinoPanelProps) {
  const expiryLabel = resolveMembershipExpiryLabel({
    status: subscription.status,
    currentPeriodEnd: subscription.currentPeriodEnd,
    subscriptionCreatedAt: subscription.createdAt,
    stripeSubscriptionId: subscription.stripeSubscriptionId,
  });
  const renewalLabel = formatRenewalDisplay(subscription.status, subscription.stripeSubscriptionId);
  const nextChargeDate = formatNextChargeDate(subscription.currentPeriodEnd);
  const autoRenewal =
    getRenewalMode(subscription.status, subscription.stripeSubscriptionId) === "automatic";

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

      <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-4 h-4 text-[#27366D]" />
          <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">
            Estado de membresía
          </h2>
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
          <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            Próximo pago: <strong>{nextChargeDate}</strong>
          </p>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-4 h-4 text-[#27366D]" />
          <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">
            Beneficios y convenios
          </h2>
        </div>
        <p className="text-sm text-slate-600 font-light mb-4">
          Consulta los negocios que ofrecen descuentos, cortesías o acceso preferente a socios de
          pago.
        </p>
        <Link
          href="/socios?beneficios=1"
          className="inline-flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-lg transition"
        >
          Consultar beneficios
        </Link>
      </section>

      {showCredential && (
        <BenefitCredentialCard
          userName={user.nombre}
          plan={subscription.plan}
          expiryLabel={expiryLabel}
        />
      )}
    </div>
  );
}
