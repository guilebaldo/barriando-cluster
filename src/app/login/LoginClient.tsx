"use client";

import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import { OAuthButtons } from "../components/OAuthButtons";
import { MEMBERSHIP_PLANS } from "@/lib/membresia";
import { registroUrl } from "@/lib/plan-routing";
import type { MembershipPlan } from "@/generated/prisma/client";
import { LogIn } from "lucide-react";

interface LoginClientProps {
  plan: MembershipPlan;
}

export default function LoginClient({ plan }: LoginClientProps) {
  const planDef = MEMBERSHIP_PLANS[plan];
  const isVecino = plan === "VECINO";

  return (
    <SiteShell>
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12 px-6 w-full">
        <div className="w-full max-w-md">
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
            <div className="flex flex-col items-center text-center gap-2 mb-6">
              <LogIn className="w-6 h-6 text-[#27366D]" />
              <h1 className="text-xl font-bold font-serif-cluster uppercase tracking-wide">Iniciar sesión</h1>
            </div>

            <div
              className={`mb-6 rounded-lg border px-4 py-4 text-center ${
                isVecino ? "border-amber-200 bg-amber-50/80" : "border-slate-200 bg-slate-50"
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#27366D] mb-1">
                {isVecino ? "Plan Vecino" : "Plan seleccionado"}
              </p>
              <p className="text-sm font-bold text-slate-900">{planDef.label}</p>
              <p className="text-xs text-slate-600 mt-2 font-light leading-relaxed">
                {isVecino
                  ? "Accede con Google para entrar a la comunidad Barriando."
                  : `Tras autenticarte continuarás al pago de certificación (${planDef.label}).`}
              </p>
            </div>

            <OAuthButtons />

            <p className="text-xs text-slate-500 mt-6 text-center">
              ¿Aún no tienes cuenta?{" "}
              <Link href={registroUrl(plan)} className="text-[#27366D] font-bold hover:underline">
                Regístrate
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </SiteShell>
  );
}
