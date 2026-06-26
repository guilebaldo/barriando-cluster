"use client";

import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import { OAuthButtons } from "../components/OAuthButtons";
import { MEMBERSHIP_PLANS } from "@/lib/membresia";
import type { MembershipPlan } from "@/generated/prisma/client";
import { UserPlus, Sparkles } from "lucide-react";

interface RegistroClientProps {
  plan: MembershipPlan;
}

export default function RegistroClient({ plan }: RegistroClientProps) {
  const planDef = MEMBERSHIP_PLANS[plan];
  const isVecino = plan === "VECINO";

  return (
    <SiteShell>
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12 px-6 w-full">
        <div className="w-full max-w-md">
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
            <div className="flex flex-col items-center text-center gap-2 mb-6">
              <UserPlus className="w-6 h-6 text-[#27366D]" />
              <h1 className="text-xl font-bold font-serif-cluster uppercase tracking-wide">
                Únete a Barriando
              </h1>
            </div>

            <div
              className={`mb-6 rounded-lg border px-4 py-4 text-center ${
                isVecino ? "border-amber-200 bg-amber-50/80" : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex justify-center mb-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#27366D] mb-1">
                Plan seleccionado
              </p>
              <p className="text-sm font-bold text-slate-900">{planDef.label}</p>
              <p className="text-xs text-slate-600 mt-2 font-light leading-relaxed">
                {isVecino
                  ? "Comunidad gratuita: newsletters, eventos del Centro Histórico y acceso al blog."
                  : "Tras iniciar sesión con Google continuarás al pago para certificar tu negocio en el Clúster."}
              </p>
            </div>

            <OAuthButtons />

            <p className="text-xs text-slate-500 mt-6 text-center">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-[#27366D] font-bold hover:underline">
                Inicia sesión
              </Link>
              {" · "}
              <Link href="/planes" className="text-[#27366D] font-bold hover:underline">
                Ver planes
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </SiteShell>
  );
}
