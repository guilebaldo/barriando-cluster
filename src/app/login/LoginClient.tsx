"use client";

import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Navbar />
      <main className="max-w-md mx-auto py-16 px-6">
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <LogIn className="w-5 h-5 text-[#27366D]" />
            <h1 className="text-xl font-bold font-serif-cluster uppercase tracking-wide">Iniciar sesión</h1>
          </div>
          <p className="text-xs text-slate-500 mb-6 font-light">
            {plan !== "VECINO"
              ? `Plan seleccionado: ${planDef.label}. Tras autenticarte continuarás al pago de certificación.`
              : "Accede con tu cuenta de Google para entrar a la comunidad Barriando."}
          </p>

          <OAuthButtons />

          <p className="text-xs text-slate-500 mt-6 text-center">
            ¿Aún no tienes cuenta?{" "}
            <Link href={registroUrl(plan)} className="text-[#27366D] font-bold hover:underline">
              Regístrate
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
