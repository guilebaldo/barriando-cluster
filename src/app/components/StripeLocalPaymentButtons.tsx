"use client";

import { useState } from "react";
import { Building2, Store } from "lucide-react";
import type { MembershipPlan } from "@/generated/prisma/client";
import type { StripeLocalPaymentMethod } from "@/lib/stripe-local-payment";
import { MEMBERSHIP_GRACE_DAYS } from "@/lib/membership-constants";

type Props = {
  plan: MembershipPlan;
  disabled?: boolean;
  /** Shown under the OXXO / SPEI buttons */
  className?: string;
};

export default function StripeLocalPaymentButtons({ plan, disabled, className }: Props) {
  const [loading, setLoading] = useState<StripeLocalPaymentMethod | null>(null);
  const [error, setError] = useState("");

  async function start(method: StripeLocalPaymentMethod) {
    setError("");
    setLoading(method);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, method }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo iniciar el pago");
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("No se recibió la URL de pago");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar pago");
      setLoading(null);
    }
  }

  return (
    <div className={className ?? "space-y-3"}>
      <button
        type="button"
        disabled={disabled || loading !== null}
        onClick={() => void start("oxxo")}
        className="w-full flex items-center justify-center gap-2 border-2 border-[#27366D] bg-white text-[#27366D] hover:bg-slate-50 font-bold text-xs uppercase tracking-wider px-5 py-3.5 rounded-lg transition disabled:opacity-50"
      >
        <Store className="w-4 h-4" />
        {loading === "oxxo" ? "Abriendo OXXO…" : "Pagar con OXXO"}
      </button>
      <button
        type="button"
        disabled={disabled || loading !== null}
        onClick={() => void start("spei")}
        className="w-full flex items-center justify-center gap-2 border border-[#27366D]/40 bg-slate-50 text-[#27366D] hover:bg-slate-100 font-bold text-xs uppercase tracking-wider px-5 py-3.5 rounded-lg transition disabled:opacity-50"
      >
        <Building2 className="w-4 h-4" />
        {loading === "spei" ? "Abriendo SPEI…" : "Pagar con transferencia SPEI"}
      </button>
      <p className="text-[10px] text-slate-500 leading-relaxed text-center">
        Pago único de un mes (mismo monto que la membresía). No es cargo automático: al confirmar Stripe
        se activa tu plan con vencimiento próximo. Renueva desde el panel cuando venza (hay{" "}
        {MEMBERSHIP_GRACE_DAYS} días de gracia).
      </p>
      {error ? <p className="text-xs text-red-600 text-center">{error}</p> : null}
    </div>
  );
}
