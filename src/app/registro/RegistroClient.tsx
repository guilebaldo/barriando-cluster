"use client";

import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { OAuthButtons, AuthDivider } from "../components/OAuthButtons";
import EmailMagicLinkForm from "../components/EmailMagicLinkForm";
import { MEMBERSHIP_PLANS } from "@/lib/membresia";
import { planToSlug } from "@/lib/plan-routing";
import type { MembershipPlan } from "@/generated/prisma/client";
import { UserPlus, Sparkles } from "lucide-react";

interface RegistroClientProps {
  plan: MembershipPlan;
}

export default function RegistroClient({ plan }: RegistroClientProps) {
  const planDef = MEMBERSHIP_PLANS[plan];
  const isVecino = plan === "VECINO";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Navbar />
      <main className="max-w-md mx-auto py-16 px-6">
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="w-5 h-5 text-[#27366D]" />
            <h1 className="text-xl font-bold font-serif-cluster uppercase tracking-wide">Únete a Barriando</h1>
          </div>
          <p className="text-xs text-slate-500 mb-6 font-light flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            {isVecino ? (
              <>
                Plan <strong className="text-slate-700">{planDef.label}</strong> — newsletters, eventos y lectura del blog.
              </>
            ) : (
              <>
                Plan <strong className="text-slate-700">{planDef.label}</strong> — tras verificar tu correo irás al pago
                para certificar tu negocio en el Clúster.
              </>
            )}
          </p>

          <OAuthButtons />
          <AuthDivider label="O con enlace mágico" />
          <EmailMagicLinkForm
            submitLabel={isVecino ? "Empezar gratis con mi correo" : "Continuar con enlace mágico"}
          />

          <p className="text-xs text-slate-500 mt-6 text-center">
            ¿Ya tienes cuenta?{" "}
            <Link href={`/login?plan=${planToSlug(plan)}`} className="text-[#27366D] font-bold hover:underline">
              Inicia sesión
            </Link>
            {" · "}
            <Link href="/planes" className="text-[#27366D] font-bold hover:underline">
              Ver planes
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
