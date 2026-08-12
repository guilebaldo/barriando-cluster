"use client";

import { useState } from "react";
import type { MembershipPlan } from "@/generated/prisma/client";

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
      const data = await res.json().catch(() => ({}));
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
    <div className={className ?? "min-w-0"}>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => void startOxxo()}
        aria-label={loading ? "Abriendo pago OXXO" : "Pagar con OXXO"}
        className="h-12 w-full inline-flex items-center justify-center rounded-lg border border-[#27366D] bg-white hover:bg-slate-50 transition disabled:opacity-50 px-3"
      >
        {loading ? (
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#27366D]">
            Abriendo…
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/logos/oxxo.svg"
            alt="OXXO"
            width={72}
            height={40}
            className="h-7 w-auto rounded-[3px]"
          />
        )}
      </button>
      {error ? <p className="mt-1.5 text-[10px] text-red-600">{error}</p> : null}
    </div>
  );
}
