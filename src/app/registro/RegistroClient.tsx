"use client";

import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import { OAuthButtons } from "../components/OAuthButtons";
import { MEMBERSHIP_PLANS, formatPlanPriceMxn } from "@/lib/membresia";
import { getUpgradePitch } from "@/lib/plan-upgrade";
import { registroUrl, planToSlug } from "@/lib/plan-routing";
import type { MembershipPlan } from "@/generated/prisma/client";
import { ArrowUpCircle, MapPin, UserPlus } from "lucide-react";

interface RegistroClientProps {
  plan: MembershipPlan;
}

export default function RegistroClient({ plan }: RegistroClientProps) {
  const planDef = MEMBERSHIP_PLANS[plan];
  const isTurista = plan === "TURISTA";
  const upgradePitch = !isTurista ? getUpgradePitch(plan) : null;
  const planSlug = planToSlug(plan);
  const continueWithPlan = `/api/onboarding/continue?plan=${planSlug}`;
  const loginHref = `/login?plan=${planSlug}&callbackUrl=${encodeURIComponent(continueWithPlan)}`;

  return (
    <SiteShell>
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12 px-6 w-full">
        <div className="w-full max-w-md">
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
            <div className="flex flex-col items-center text-center gap-2 mb-6">
              <UserPlus className="w-6 h-6 text-[#27366D]" />
              <h1 className="text-xl font-bold font-serif-cluster uppercase tracking-wide">
                {isTurista ? "Regístrate como Turista" : "Únete a Barriando"}
              </h1>
              <p className="text-xs text-slate-500 font-light leading-relaxed">
                {isTurista
                  ? "Acceso gratuito al Pasaporte MAP, rutas peatonales y novedades del Centro Histórico."
                  : "Tras iniciar sesión con Google continuarás a la selección de método de pago para activar tu plan."}
              </p>
            </div>

            {isTurista ? (
              <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-4 text-center">
                <MapPin className="w-5 h-5 text-amber-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-900">Perfil Turista · Gratis</p>
                <p className="text-xs text-slate-600 mt-2 font-light leading-relaxed">
                  Explora Puebla, colecciona sellos de temporada y guarda tu progreso en la nube.
                </p>
              </div>
            ) : (
              <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#27366D] mb-1">
                  Plan seleccionado
                </p>
                <p className="text-sm font-bold text-slate-900">{planDef.label}</p>
                <p className="text-lg font-black text-[#27366D] mt-1">
                  {formatPlanPriceMxn(plan as Parameters<typeof formatPlanPriceMxn>[0])}
                </p>
                <p className="text-xs text-slate-600 mt-2 font-light leading-relaxed">
                  {planDef.description}
                </p>
              </div>
            )}

            <OAuthButtons plan={plan} />

            {upgradePitch && (
              <div className="mt-8 rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-white p-5">
                <div className="flex items-start gap-3">
                  <ArrowUpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-[#27366D]">
                      ¿Necesitas más visibilidad? Conoce {upgradePitch.label}
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {upgradePitch.benefits.map((b) => (
                        <li key={b} className="text-[11px] text-slate-600 leading-relaxed">
                          · {b}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={registroUrl(upgradePitch.nextPlan)}
                      className="inline-flex mt-4 items-center justify-center w-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg transition-all"
                    >
                      Ver plan {upgradePitch.label}
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <p className="text-xs text-slate-500 mt-6 text-center">
              ¿Ya tienes cuenta?{" "}
              <Link
                href={loginHref}
                className="text-[#27366D] font-bold hover:text-red-800 active:text-red-900 transition-colors"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </SiteShell>
  );
}
