"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Store } from "lucide-react";
import { hasCommercialAccess } from "@/lib/membresia";

/** Bloque CTA de inscripción al MAP (respeta Gran Empresa ya activa). */
export default function MapPageBusinessCta() {
  const { data: session, status } = useSession();
  const plan = session?.user?.plan;
  const subscriptionStatus = session?.user?.subscriptionStatus ?? "inactive";
  const alreadyOnMap =
    status === "authenticated" &&
    plan === "GRAN_EMPRESA" &&
    hasCommercialAccess(plan, subscriptionStatus);

  return (
    <section className="mt-10 bg-gradient-to-br from-amber-50 via-white to-slate-50 border border-amber-200 rounded-2xl p-6 md:p-8 text-center shadow-sm">
      <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#27366D]/10 text-[#27366D] mb-4">
        <Store className="w-6 h-6" aria-hidden />
      </span>
      <h2 className="text-lg md:text-xl font-black font-serif-cluster uppercase tracking-wide text-[#27366D]">
        ¿Tu negocio está en el Centro Histórico?
      </h2>
      {alreadyOnMap ? (
        <>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto font-light leading-relaxed mt-3">
            Tu plan Gran Empresa ya incluye presencia en la ruta peatonal oficial del MAP.
          </p>
          <p
            className="mt-6 text-xs font-bold text-[#27366D]"
            title="Tu plan Gran Empresa ya incluye presencia en el MAP"
          >
            Ya formas parte del MAP con tu plan Gran Empresa.
          </p>
        </>
      ) : (
        <>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto font-light leading-relaxed mt-3">
            Inscríbete al MAP con el plan Gran Empresa y aparece en la ruta peatonal oficial. Los
            visitantes te encontrarán caminando el circuito, podrán escanear tu QR y sumar sellos en
            su Pasaporte Digital.
          </p>
          <Link
            href="/planes?tipo=comerciales#gran_empresa"
            className="inline-flex items-center gap-2 mt-6 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-lg transition-all"
          >
            Inscribir mi negocio al MAP
          </Link>
        </>
      )}
    </section>
  );
}
