"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import SiteShell from "@/app/components/SiteShell";
import TransferPaymentSection from "@/app/panel/TransferPaymentSection";
import {
  MEMBERSHIP_PLANS,
  formatPlanPriceMxn,
  getPlanLabel,
  type PaidMembershipPlan,
} from "@/lib/membresia";
import { reportManualPayment } from "@/app/panel/actions";
import type { MembershipPlan } from "@/generated/prisma/client";
import { CreditCard, ShieldCheck } from "lucide-react";

interface CertificacionPagoClientProps {
  plan: MembershipPlan;
  stripeConfigured: boolean;
  paymentDetails: {
    clabe: string;
    bankLabel: string;
    paymentEmail: string;
  };
  cancelNotice?: string | null;
}

export default function CertificacionPagoClient({
  plan,
  stripeConfigured,
  paymentDetails,
  cancelNotice,
}: CertificacionPagoClientProps) {
  const router = useRouter();
  const [payMsg, setPayMsg] = useState("");
  const [manualMsg, setManualMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const paidPlan = plan as PaidMembershipPlan;
  const planDef = MEMBERSHIP_PLANS[plan];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("pago") === "cancelado") {
      params.delete("pago");
      const qs = params.toString();
      window.history.replaceState(
        null,
        "",
        qs ? `${window.location.pathname}?${qs}` : window.location.pathname
      );
    }
  }, []);

  async function handleStripePay() {
    setPayMsg("");
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }

  async function handleManualPayment() {
    setManualMsg("");
    const result = await reportManualPayment(plan);
    if (!result.ok) {
      setManualMsg(result.error);
      return;
    }
    setManualMsg("Solicitud registrada. Redirigiendo a tu panel...");
    router.push("/panel");
    router.refresh();
  }

  return (
    <SiteShell>
      <Navbar />
      <main className="flex-1 max-w-lg mx-auto py-12 px-6 w-full">
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm space-y-6">
          <div className="text-center">
            <ShieldCheck className="w-8 h-8 text-[#27366D] mx-auto mb-3" />
            <h1 className="text-xl font-bold font-serif-cluster uppercase tracking-wide text-slate-950">
              Selección de Método de Pago para Certificación
            </h1>
            <p className="text-xs text-slate-500 mt-2 font-light leading-relaxed">
              Completa el pago para activar tu membresía de socio certificado. Hasta entonces, el panel
              comercial permanecerá bloqueado.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#27366D] mb-1">
              Plan seleccionado
            </p>
            <p className="text-sm font-bold text-slate-900">{getPlanLabel(plan)}</p>
            <p className="text-lg font-black text-[#27366D] mt-1">{formatPlanPriceMxn(paidPlan)}</p>
            <p className="text-xs text-slate-600 mt-2 font-light">{planDef.description}</p>
          </div>

          {cancelNotice && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-3 text-xs">
              {cancelNotice}
            </div>
          )}

          <div className="space-y-4">
            {stripeConfigured ? (
              <button
                type="button"
                disabled={loading}
                onClick={handleStripePay}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider px-5 py-3.5 rounded-lg transition disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" />
                {loading ? "Redirigiendo a Stripe..." : "Pagar con tarjeta (Stripe)"}
              </button>
            ) : (
              <p className="text-xs text-amber-700 text-center">
                El pago con tarjeta no está disponible en este momento.
              </p>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white px-2 text-slate-400">o</span>
              </div>
            </div>

            <TransferPaymentSection
              plan={plan}
              onConfirm={handleManualPayment}
              disabled={loading}
              clabe={paymentDetails.clabe}
              bankLabel={paymentDetails.bankLabel}
              paymentEmail={paymentDetails.paymentEmail}
            />
          </div>

          {(payMsg || manualMsg) && (
            <p className="text-xs text-slate-600 text-center">{payMsg || manualMsg}</p>
          )}

          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            Al pagar con tarjeta, tu plan se activará automáticamente al confirmar el pago. Con
            transferencia, un administrador validará tu comprobante antes de habilitar las herramientas.
          </p>

          <Link
            href="/planes"
            className="block text-center text-xs text-[#27366D] hover:underline"
          >
            Cambiar plan
          </Link>
        </div>
      </main>
      <Footer />
    </SiteShell>
  );
}
