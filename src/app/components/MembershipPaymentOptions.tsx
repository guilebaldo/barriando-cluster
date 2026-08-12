"use client";

import { CreditCard } from "lucide-react";
import type { MembershipPlan } from "@/generated/prisma/client";
import AcceptedPaymentMethods from "./AcceptedPaymentMethods";
import StripeLocalPaymentButtons from "./StripeLocalPaymentButtons";
import TransferPaymentSection from "@/app/panel/TransferPaymentSection";

const PAY_BTN =
  "h-12 w-full inline-flex items-center justify-center gap-2 rounded-lg text-xs font-bold uppercase tracking-wider px-5 transition disabled:opacity-50";

type Props = {
  plan: MembershipPlan;
  stripeConfigured: boolean;
  disabled?: boolean;
  stripeLoading?: boolean;
  onStripePay: () => void;
  onManualConfirm: (plan: MembershipPlan) => Promise<void>;
  paymentDetails: {
    clabe: string;
    bankLabel: string;
    paymentEmail: string;
  };
  showTransfer?: boolean;
  showOxxo?: boolean;
  stripeLabel?: string;
};

export default function MembershipPaymentOptions({
  plan,
  stripeConfigured,
  disabled,
  stripeLoading,
  onStripePay,
  onManualConfirm,
  paymentDetails,
  showTransfer = true,
  showOxxo = true,
  stripeLabel = "Domiciliar con tarjeta",
}: Props) {
  const manualAvailable = (stripeConfigured && showOxxo) || showTransfer;

  return (
    <div className="space-y-4">
      {stripeConfigured ? (
        <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#27366D]">
              Domiciliación
            </p>
            <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
              Cargo automático mensual a tarjeta bancaria.
            </p>
          </div>
          <button
            type="button"
            disabled={disabled || stripeLoading}
            onClick={onStripePay}
            className={`${PAY_BTN} bg-amber-500 hover:bg-amber-400 text-slate-950`}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            {stripeLoading ? "Redirigiendo…" : stripeLabel}
          </button>
          <AcceptedPaymentMethods includeOxxo={false} caption="" align="center" />
        </section>
      ) : null}

      {manualAvailable ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#27366D]">
              Pago mensual manual
            </p>
            <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
              Paga un mes con OXXO o SPEI. Sin cargo recurrente.
            </p>
          </div>
          <div className={`grid gap-2 ${stripeConfigured && showOxxo && showTransfer ? "grid-cols-2" : "grid-cols-1"}`}>
            {stripeConfigured && showOxxo ? (
              <StripeLocalPaymentButtons plan={plan} disabled={disabled} />
            ) : null}
            {showTransfer ? (
              <TransferPaymentSection
                plan={plan}
                onConfirm={onManualConfirm}
                disabled={disabled}
                clabe={paymentDetails.clabe}
                bankLabel={paymentDetails.bankLabel}
                paymentEmail={paymentDetails.paymentEmail}
              />
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
