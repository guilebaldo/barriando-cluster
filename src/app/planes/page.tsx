import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import { MEMBERSHIP_PLANS, PAID_PLANS, formatPlanPriceMxn } from "@/lib/membresia";
import PlanSelectButton from "./PlanSelectButton";
import { registroUrl, planToSlug, parsePlanSlug } from "@/lib/plan-routing";
import { getSession } from "@/lib/auth-utils";
import { Check } from "lucide-react";
import type { MembershipPlan } from "@/generated/prisma/client";

export default async function PlanesPage({
  searchParams,
}: {
  searchParams: Promise<{ cambio?: string; plan?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  const isPlanChange = params.cambio === "1" && Boolean(session);
  const highlightPlan = parsePlanSlug(params.plan);

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

        <div className="flex flex-wrap justify-center gap-5">
          <div className="w-full md:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] xl:w-[240px] max-w-[320px]">
            <PlanCard
              planId="TURISTA"
              cta="Empezar Gratis"
              featured={false}
              highlighted={false}
              isAuthenticated={Boolean(session)}
              isPlanChange={isPlanChange}
            />
          </div>

          {PAID_PLANS.map((planId) => (
            <div
              key={planId}
              className="w-full md:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] xl:w-[240px] max-w-[320px]"
            >
              <PlanCard
                planId={planId}
                cta={planId === "GRAN_EMPRESA" ? "Aparecer en el MAP" : "Elegir Plan"}
                featured={planId === "GRAN_EMPRESA"}
                highlighted={highlightPlan === planId}
                isAuthenticated={Boolean(session)}
                isPlanChange={isPlanChange}
              />
            </div>
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
  highlighted,
  isAuthenticated,
  isPlanChange,
}: {
  planId: keyof typeof MEMBERSHIP_PLANS;
  cta: string;
  featured: boolean;
  highlighted: boolean;
  isAuthenticated: boolean;
  isPlanChange: boolean;
}) {
  const plan = MEMBERSHIP_PLANS[planId];
  const useDirectSelect = isAuthenticated && (isPlanChange || plan.isPaid);
  const isEmphasized = featured || highlighted;

  return (
    <div
      id={planId === "GRAN_EMPRESA" ? "gran_empresa" : undefined}
      className={`flex flex-col rounded-xl border p-6 bg-white shadow-sm h-full scroll-mt-24 ${
        isEmphasized ? "border-amber-400 ring-2 ring-amber-400/40" : "border-slate-200"
      }`}
    >
      {featured && (
        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full self-start mb-3">
          Presencia en el MAP
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
              ? planId === "GRAN_EMPRESA"
                ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                : "bg-[#27366D] hover:bg-[#1e2b58] text-white"
              : "bg-amber-500 hover:bg-amber-400 text-slate-950"
          }`}
        />
      ) : (
        <Link
          href={registroUrl(planId as MembershipPlan)}
          className={`block text-center font-bold text-xs uppercase tracking-wider py-3 rounded-lg transition ${
            plan.isPaid
              ? planId === "GRAN_EMPRESA"
                ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                : "bg-[#27366D] hover:bg-[#1e2b58] text-white"
              : "bg-amber-500 hover:bg-amber-400 text-slate-950"
          }`}
        >
          {cta}
        </Link>
      )}
    </div>
  );
}
