"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
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

export default function BenefitVerifyClient({ token, beneficiary }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedName, setConfirmedName] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    const result = await confirmBenefitRedemption(token);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setConfirmedName(result.beneficiaryName);
  }

  if (confirmedName) {
    return (
      <div className="bg-white border border-emerald-200 rounded-xl p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-emerald-700">
          <ShieldCheck className="w-5 h-5" />
          <h1 className="text-xl font-black font-serif-cluster uppercase tracking-wide">
            Canje confirmado
          </h1>
        </div>
        <p className="text-sm text-slate-700">
          Beneficio otorgado a <strong>{confirmedName}</strong>. El registro quedó guardado.
        </p>
        <Link
          href="/panel"
          className="inline-flex text-xs font-bold text-[#27366D] hover:underline uppercase tracking-wider"
        >
          Volver al panel
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
      <h1 className="text-xl font-black font-serif-cluster uppercase tracking-wide text-slate-950">
        Validar beneficio
      </h1>
      <p className="text-sm text-slate-600 font-light">
        Revisa los datos del socio antes de confirmar el canje.
      </p>

      <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 space-y-2 text-sm">
        <p>
          <span className="text-slate-500 text-xs uppercase tracking-wider font-bold">Nombre</span>
          <br />
          <strong className="text-slate-900">{beneficiary.nombre}</strong>
        </p>
        {beneficiary.email && (
          <p className="text-xs text-slate-500">{beneficiary.email}</p>
        )}
        <p>
          <span className="text-slate-500 text-xs uppercase tracking-wider font-bold">Plan</span>
          <br />
          <strong className="text-[#27366D]">{beneficiary.planLabel}</strong>
        </p>
        <p>
          <span className="text-slate-500 text-xs uppercase tracking-wider font-bold">Estado</span>
          <br />
          <strong className="text-green-700">{beneficiary.statusLabel}</strong>
        </p>
        <p>
          <span className="text-slate-500 text-xs uppercase tracking-wider font-bold">Vigencia</span>
          <br />
          <strong className="text-slate-900">{beneficiary.expiryLabel}</strong>
        </p>
      </div>

      <button
        type="button"
        onClick={handleConfirm}
        disabled={loading}
        className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-lg transition"
      >
        {loading ? "Confirmando…" : "Confirmar canje"}
      </button>
      {error && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
