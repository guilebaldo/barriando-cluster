"use client";

import { useState } from "react";
import { Store } from "lucide-react";
import type { MembershipPlan } from "@/generated/prisma/client";
import { MEMBERSHIP_GRACE_DAYS } from "@/lib/membership-constants";

type Props = {
  plan: MembershipPlan;
  disabled?: boolean;
  className?: string;
};

/** Pago único de un mes vía OXXO (Stripe Checkout mode=payment). */
export default function StripeLocalPaymentButtons({ plan, disabled, className }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startOxxo() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, method: "oxxo" }),
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
      setLoading(false);
    }
  }

  return (
    <div className={className ?? "space-y-3"}>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => void startOxxo()}
        className="w-full flex items-center justify-center gap-2 border-2 border-[#27366D] bg-white text-[#27366D] hover:bg-slate-50 font-bold text-xs uppercase tracking-wider px-5 py-3.5 rounded-lg transition disabled:opacity-50"
      >
        <Store className="w-4 h-4" />
        {loading ? "Abriendo OXXO…" : "Pagar con OXXO"}
      </button>
      <p className="text-[10px] text-slate-500 leading-relaxed text-center">
        Pago único de un mes (mismo monto que la membresía). Stripe te muestra un código de barras:
        págalo en cualquier OXXO. Cuando Stripe confirme el depósito (suele ser al día siguiente
        hábil), tu plan se activa solo. Renueva desde el panel al vencer ({MEMBERSHIP_GRACE_DAYS}{" "}
        días de gracia).
      </p>
      {error ? <p className="text-xs text-red-600 text-center">{error}</p> : null}
    </div>
  );
}
