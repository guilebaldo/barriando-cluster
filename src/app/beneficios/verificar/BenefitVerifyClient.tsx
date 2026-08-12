"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { confirmBenefitRedemption } from "../actions";

type Props = {
  token: string;
  beneficiary: {
    id: string;
    nombre: string;
    email: string;
    planLabel: string;
    statusLabel: string;
    expiryLabel: string;
  };
};

type Phase = "redeeming" | "success" | "error";

export default function BenefitVerifyClient({ token, beneficiary }: Props) {
  const [phase, setPhase] = useState<Phase>("redeeming");
  const [error, setError] = useState<string | null>(null);
  const [confirmedName, setConfirmedName] = useState(beneficiary.nombre);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await confirmBenefitRedemption(token);
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        setPhase("error");
        return;
      }
      setConfirmedName(result.beneficiaryName);
      setPhase("success");
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (phase === "success") {
    return (
      <div
        className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-emerald-500 text-white px-6"
        role="status"
        aria-live="polite"
        aria-label="Canje confirmado"
      >
        <div className="flex flex-col items-center animate-redeem-success">
          <div className="flex h-28 w-28 items-center justify-center rounded-full border-[3px] border-white shadow-[0_0_0_12px_rgba(255,255,255,0.18)]">
            <Check className="h-14 w-14 stroke-[2.5]" absoluteStrokeWidth />
          </div>
          <p className="mt-8 text-center text-lg font-semibold tracking-wide">
            Canje listo
          </p>
          <p className="mt-2 max-w-xs text-center text-sm text-emerald-50/95 font-light">
            Cupón otorgado a <span className="font-semibold text-white">{confirmedName}</span>
          </p>
        </div>
        <Link
          href="/panel"
          className="absolute bottom-[max(2rem,calc(env(safe-area-inset-bottom)+1.25rem))] text-xs font-bold uppercase tracking-wider text-white/85 underline decoration-white/40 underline-offset-4 hover:text-white"
        >
          Volver al panel
        </Link>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6 shadow-sm space-y-3">
        <h1 className="text-xl font-black font-serif-cluster uppercase tracking-wide text-slate-950">
          No se pudo canjear
        </h1>
        <p className="text-sm text-red-800">{error}</p>
        <Link
          href="/panel"
          className="inline-flex text-xs font-bold text-[#27366D] hover:underline uppercase tracking-wider"
        >
          Ir al panel
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-emerald-500/95 text-white px-6">
      <div className="h-12 w-12 rounded-full border-2 border-white/35 border-t-white animate-spin" />
      <p className="mt-6 text-sm font-medium tracking-wide text-emerald-50">
        Validando cupón…
      </p>
    </div>
  );
}
