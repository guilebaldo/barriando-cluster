"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import SiteShell from "@/app/components/SiteShell";
import MembershipPaymentOptions from "@/app/components/MembershipPaymentOptions";
import {
  MEMBERSHIP_PLANS,
  formatPlanPriceMxn,
  getPlanLabel,
  type PaidMembershipPlan,
} from "@/lib/membresia";
import { reportManualPayment } from "@/app/panel/actions";
import type { MembershipPlan } from "@/generated/prisma/client";
import { Clock, ShieldCheck } from "lucide-react";

interface CertificacionPagoClientProps {
  plan: MembershipPlan;
  stripeConfigured: boolean;
  paymentDetails: {
    clabe: string;
    bankLabel: string;
    paymentEmail: string;
  };
  cancelNotice?: string | null;
  /** Ya generó ficha OXXO; Stripe aún no acredita. */
  awaitingOxxo?: boolean;
}

export default function CertificacionPagoClient({
  plan,
  stripeConfigured,
  paymentDetails,
  cancelNotice,
  awaitingOxxo = false,
}: CertificacionPagoClientProps) {
  const router = useRouter();
  const [payMsg, setPayMsg] = useState("");
  const [manualMsg, setManualMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtherMethods, setShowOtherMethods] = useState(!awaitingOxxo);

  const paidPlan = plan as PaidMembershipPlan;
  const planDef = MEMBERSHIP_PLANS[plan];

  useEffect(() => {
    setShowOtherMethods(!awaitingOxxo);
  }, [awaitingOxxo]);

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
      <main className="flex-1 max-w-lg mx-auto py-12 px-6 w-full pb-[calc(3.5rem+env(safe-area-inset-bottom,0px)+2rem)] md:pb-12">
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm space-y-6">
          <div className="text-center">
            {awaitingOxxo && !showOtherMethods ? (
              <Clock className="w-8 h-8 text-amber-500 mx-auto mb-3" />
            ) : (
              <ShieldCheck className="w-8 h-8 text-[#27366D] mx-auto mb-3" />
            )}
            <h1 className="text-xl font-bold font-serif-cluster uppercase tracking-wide text-slate-950">
              {awaitingOxxo && !showOtherMethods
                ? "Estamos esperando tu pago"
                : "Selección de Método de Pago para Certificación"}
            </h1>
            <p className="text-xs text-slate-500 mt-2 font-light leading-relaxed">
              {awaitingOxxo && !showOtherMethods
                ? "Ya tienes tu ficha OXXO. Cuando Stripe confirme el depósito, tu membresía se activa sola."
                : "Completa el pago para activar tu membresía de socio certificado. Hasta entonces, el panel comercial permanecerá bloqueado."}
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

          {awaitingOxxo && !showOtherMethods ? (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 text-amber-950 rounded-xl p-4 text-xs leading-relaxed">
                <p className="font-bold text-[#27366D] mb-1">Pago OXXO en proceso</p>
                <p className="font-light">
                  Paga en cualquier OXXO con tu ficha y conserva el comprobante. La acreditación suele
                  llegar al día siguiente hábil; no requiere validación de un administrador (a diferencia
                  de la transferencia CLABE).
                </p>
              </div>
              <Link
                href="/panel"
                className="w-full inline-flex items-center justify-center bg-[#27366D] hover:bg-[#1e2b58] text-white font-bold text-xs uppercase tracking-wider px-5 py-3.5 rounded-lg transition"
              >
                Ir a Mi cuenta
              </Link>
              <button
                type="button"
                onClick={() => setShowOtherMethods(true)}
                className="w-full text-center text-xs text-[#27366D] hover:underline font-semibold"
              >
                Elegir otro método de pago
              </button>
            </div>
          ) : (
            <>
              {cancelNotice && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-3 text-xs">
                  {cancelNotice}
                </div>
              )}

              <div className="space-y-4">
                {stripeConfigured ? null : (
                  <p className="text-xs text-amber-700 text-center">
                    El pago con tarjeta no está disponible en este momento.
                  </p>
                )}
                <MembershipPaymentOptions
                  plan={plan}
                  stripeConfigured={stripeConfigured}
                  disabled={loading}
                  stripeLoading={loading}
                  onStripePay={handleStripePay}
                  onManualConfirm={handleManualPayment}
                  paymentDetails={paymentDetails}
                  showOxxo={stripeConfigured}
                />
              </div>

              {(payMsg || manualMsg) && (
                <p className="text-xs text-slate-600 text-center">{payMsg || manualMsg}</p>
              )}

              {awaitingOxxo ? (
                <button
                  type="button"
                  onClick={() => setShowOtherMethods(false)}
                  className="block w-full text-center text-xs text-slate-500 hover:underline"
                >
                  Volver al aviso de espera OXXO
                </button>
              ) : null}
            </>
          )}

          <div className="flex flex-col items-center gap-2 pt-1">
            <Link
              href="/planes?cambio=1"
              className="text-center text-xs text-slate-500 hover:underline"
            >
              Cambiar plan
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </SiteShell>
  );
}
