import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import { MEMBERSHIP_PLANS, PAID_PLANS, formatPlanPriceMxn } from "@/lib/membresia";
import PlanSelectButton from "./PlanSelectButton";
import { registroUrl } from "@/lib/plan-routing";
import { getSession } from "@/lib/auth-utils";
import { Check } from "lucide-react";
import type { MembershipPlan } from "@/generated/prisma/client";

export default async function PlanesPage({
  searchParams,
}: {
  searchParams: Promise<{ cambio?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  const isPlanChange = params.cambio === "1" && Boolean(session);

  return (
    <SiteShell>
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto py-16 px-6 w-full">
        <div className="text-center mb-12">
          <span className="text-[#27366D] font-bold text-xs uppercase tracking-widest">Membresías</span>
          <h1 className="text-3xl md:text-4xl font-extrabold mt-2 font-serif-cluster uppercase tracking-wide text-slate-950">
            {isPlanChange ? "Cambia tu plan" : "Elige cómo sumarte al Barrio"}
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto mt-3 font-light">
            {isPlanChange
              ? "Selecciona un nuevo plan. Continuarás al método de pago sin volver a iniciar sesión."
              : "Desde la comunidad gratuita hasta la certificación comercial para negocios exclusivos del Clúster Barriando en el Centro Histórico de Puebla."}
          </p>
          {isPlanChange && (
            <Link
              href="/certificacion/pago"
              className="inline-block mt-4 text-xs text-[#27366D] hover:underline"
            >
              ← Volver al pago
            </Link>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          <PlanCard
            planId="TURISTA"
            cta="Empezar Gratis"
            featured={false}
            isAuthenticated={Boolean(session)}
            isPlanChange={isPlanChange}
          />

          {PAID_PLANS.map((planId) => (
            <PlanCard
              key={planId}
              planId={planId}
              cta="Elegir Plan"
              featured={planId === "NEGOCIO_FAMILIAR"}
              isAuthenticated={Boolean(session)}
              isPlanChange={isPlanChange}
            />
          ))}
        </div>
      </main>
      <Footer />
    </SiteShell>
  );
}

function PlanCard({
  planId,
  cta,
  featured,
  isAuthenticated,
  isPlanChange,
}: {
  planId: keyof typeof MEMBERSHIP_PLANS;
  cta: string;
  featured: boolean;
  isAuthenticated: boolean;
  isPlanChange: boolean;
}) {
  const plan = MEMBERSHIP_PLANS[planId];
  const useDirectSelect = isAuthenticated && (isPlanChange || plan.isPaid);

  return (
    <div
      className={`flex flex-col rounded-xl border p-6 bg-white shadow-sm h-full ${
        featured ? "border-amber-400 ring-1 ring-amber-400/30" : "border-slate-200"
      }`}
    >
      {featured && (
        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full self-start mb-3">
          Popular
        </span>
      )}
      <h2 className="font-bold text-slate-950 text-sm">{plan.label}</h2>
      <p className="text-lg font-black text-[#27366D] mt-2">
        {plan.isPaid ? formatPlanPriceMxn(planId as Parameters<typeof formatPlanPriceMxn>[0]) : "Gratis"}
      </p>
      <p className="text-[11px] text-amber-700 font-semibold mt-0.5">{plan.tagline}</p>
      <p className="text-xs text-slate-500 mt-3 mb-4 font-light leading-relaxed flex-1">{plan.description}</p>
      <ul className="space-y-2 mb-6">
        {plan.benefits.slice(0, 4).map((b) => (
          <li key={b} className="flex gap-2 text-[11px] text-slate-600">
            <Check className="w-3.5 h-3.5 text-[#27366D] shrink-0 mt-0.5" />
            {b}
          </li>
        ))}
      </ul>
      {useDirectSelect ? (
        <PlanSelectButton
          planId={planId as MembershipPlan}
          label={isPlanChange ? "Seleccionar" : cta}
          className={`block w-full text-center font-bold text-xs uppercase tracking-wider py-3 rounded-lg transition ${
            plan.isPaid
              ? "bg-[#27366D] hover:bg-[#1e2b58] text-white"
              : "bg-amber-500 hover:bg-amber-400 text-slate-950"
          }`}
        />
      ) : (
        <Link
          href={registroUrl(planId as MembershipPlan)}
          className={`block text-center font-bold text-xs uppercase tracking-wider py-3 rounded-lg transition ${
            plan.isPaid
              ? "bg-[#27366D] hover:bg-[#1e2b58] text-white"
              : "bg-amber-500 hover:bg-amber-400 text-slate-950"
          }`}
        >
          {cta}
        </Link>
      )}
    </div>
  );
}
