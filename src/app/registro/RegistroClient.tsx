"use client";

import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import { OAuthButtons } from "../components/OAuthButtons";
import { MEMBERSHIP_PLANS } from "@/lib/membresia";
import type { MembershipPlan } from "@/generated/prisma/client";
import { Building2, MapPin, UserPlus } from "lucide-react";

interface RegistroClientProps {
  plan: MembershipPlan;
}

export default function RegistroClient({ plan }: RegistroClientProps) {
  const planDef = MEMBERSHIP_PLANS[plan];
  const isTurista = plan === "TURISTA";

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
                  : "Tras iniciar sesión con Google continuarás al pago para activar tu plan."}
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
                <p className="text-xs text-slate-600 mt-2 font-light leading-relaxed">
                  {planDef.description}
                </p>
              </div>
            )}

            <OAuthButtons />

            <div className="mt-8 rounded-xl border border-[#27366D]/15 bg-gradient-to-br from-slate-50 to-amber-50/40 p-5">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-[#27366D] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-[#27366D]">¿Tienes un negocio?</p>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-light">
                    Contamos con planes especiales para certificar tu establecimiento, obtener exposición
                    extra en el sitio y formar parte de las rutas oficiales del MAP.
                  </p>
                  <Link
                    href="/planes"
                    className="inline-flex mt-4 items-center justify-center w-full sm:w-auto bg-[#27366D] hover:bg-[#1e2b58] active:scale-95 text-amber-400 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg transition-all"
                  >
                    Ver planes para socios
                  </Link>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-6 text-center">
              ¿Ya tienes cuenta?{" "}
              <Link
                href="/login"
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
