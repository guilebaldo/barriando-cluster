"use client";

import Image from "next/image";
import Link from "next/link";
import { Gift, Settings } from "lucide-react";
import type { MembershipPlan } from "@/generated/prisma/client";
import BenefitCredentialCard from "../panel/BenefitCredentialCard";

type BarrIdClientProps = {
  user: {
    nombre: string;
    email: string;
    image: string | null;
  };
  plan: MembershipPlan;
  planLabel: string;
  statusLabel: string;
  priceLabel: string;
  expiryLabel: string;
  renewalLabel: string;
  stampedCount: number;
  totalRestaurants: number;
  progress: number;
  isAdmin: boolean;
};

export default function BarrIdClient({
  user,
  plan,
  planLabel,
  statusLabel,
  priceLabel,
  expiryLabel,
  renewalLabel,
  stampedCount,
  totalRestaurants,
  progress,
  isAdmin,
}: BarrIdClientProps) {
  return (
    <div className="space-y-5">
      <section className="bg-[#27366D] text-white rounded-2xl p-6 sm:p-7 border border-[#1e2b58] relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">BarrID</p>
            <p className="text-[10px] text-slate-300 mt-1 uppercase tracking-wider font-semibold">
              Credencial de socio
            </p>
          </div>
          <Link
            href="/panel"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-white/20 text-white hover:bg-white/10 transition"
            aria-label="Configuración / Mi Panel"
            title="Configuración"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>

        <div className="mt-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-200 shrink-0 border-2 border-amber-400/40">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.nombre}
                width={56}
                height={56}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-300 text-[#27366D] font-bold text-lg">
                {user.nombre.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-black font-serif-cluster uppercase tracking-wide truncate">
              {user.nombre}
            </h1>
            <p className="text-xs text-slate-300 truncate">{user.email}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mt-1">
              {planLabel}
            </p>
          </div>
        </div>
      </section>

      <BenefitCredentialCard userName={user.nombre} plan={plan} expiryLabel={expiryLabel} />

      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest mb-3">
          Progreso del Pasaporte
        </h2>
        <p className="text-sm text-slate-700 mb-3">
          Llevas{" "}
          <strong className="text-[#27366D]">
            {stampedCount} de {totalRestaurants}
          </strong>{" "}
          lugares sellados
        </p>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-400 mt-2">{progress}% completado</p>
        <Link
          href="/pasaporte"
          className="mt-4 inline-flex text-xs font-bold text-[#27366D] hover:underline uppercase tracking-wider"
        >
          Ver pasaporte
        </Link>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest mb-3">
          Estado de membresía
        </h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Plan</dt>
            <dd className="font-semibold text-slate-900 text-right">{planLabel}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Estado</dt>
            <dd className="font-semibold text-green-700 text-right">{statusLabel}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Cuota</dt>
            <dd className="font-semibold text-[#27366D] text-right">{priceLabel}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Vencimiento</dt>
            <dd className="font-semibold text-slate-900 text-right">{expiryLabel}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">Tipo de pago</dt>
            <dd className="font-semibold text-slate-900 text-right">{renewalLabel}</dd>
          </div>
        </dl>
      </section>

      <Link
        href="/socios?beneficios=1"
        className="w-full inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider px-5 py-3.5 rounded-lg transition shadow-sm"
      >
        <Gift className="w-4 h-4" />
        Ver socios con beneficios
      </Link>

      {isAdmin && (
        <Link
          href="/admin"
          className="w-full inline-flex items-center justify-center border border-[#27366D] text-[#27366D] hover:bg-[#27366D]/5 text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-lg transition"
        >
          Panel admin
        </Link>
      )}
    </div>
  );
}
