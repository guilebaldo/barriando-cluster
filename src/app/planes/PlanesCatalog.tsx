"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { MEMBERSHIP_PLANS, PAID_PLANS, formatPlanPriceMxn } from "@/lib/membresia";
import { registroUrl } from "@/lib/plan-routing";
import type { MembershipPlan } from "@/generated/prisma/client";
import PlanSelectButton from "./PlanSelectButton";
import PlanSwipeDeck, { planDeckStopDragProps } from "./PlanSwipeDeck";

export type PlanAudienceFilter = "personales" | "comerciales";

const PERSONAL_PLANS: MembershipPlan[] = ["TURISTA", "VECINO"];

const ALL_PLAN_IDS: MembershipPlan[] = ["TURISTA", ...PAID_PLANS];

const FILTER_OPTIONS: { id: PlanAudienceFilter; label: string }[] = [
  { id: "personales", label: "Personales" },
  { id: "comerciales", label: "Comerciales" },
];

function planAudience(planId: MembershipPlan): PlanAudienceFilter {
  return PERSONAL_PLANS.includes(planId) ? "personales" : "comerciales";
}

function planCta(planId: MembershipPlan): string {
  switch (planId) {
    case "TURISTA":
      return "Empezar gratis";
    case "VECINO":
      return "Quiero BarrID";
    case "NEGOCIO_FAMILIAR":
      return "Entrar al directorio";
    case "MEDIANA_EMPRESA":
      return "Destacar mi negocio";
    default:
      return "Aparecer en el MAP";
  }
}

export default function PlanesCatalog({
  isAuthenticated,
  isPlanChange,
  highlightPlan,
  initialFilters = [],
  currentPlan = null,
}: {
  isAuthenticated: boolean;
  isPlanChange: boolean;
  highlightPlan: MembershipPlan | null;
  initialFilters?: PlanAudienceFilter[];
  currentPlan?: MembershipPlan | null;
}) {
  const [activeFilters, setActiveFilters] = useState<PlanAudienceFilter[]>(initialFilters);

  // Turista ya registrado: su siguiente paso natural es Vecino.
  const effectiveHighlight =
    highlightPlan ?? (currentPlan === "TURISTA" ? ("VECINO" as MembershipPlan) : null);

  function toggleFilter(id: PlanAudienceFilter) {
    setActiveFilters((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  }

  const visiblePlans = useMemo(() => {
    if (activeFilters.length === 0) return ALL_PLAN_IDS;
    return ALL_PLAN_IDS.filter((planId) => activeFilters.includes(planAudience(planId)));
  }, [activeFilters]);

  const mobileStartIndex = useMemo(() => {
    if (!effectiveHighlight) return 0;
    const i = visiblePlans.indexOf(effectiveHighlight);
    return i >= 0 ? i : 0;
  }, [visiblePlans, effectiveHighlight]);

  function renderPlanCard(planId: MembershipPlan, withAnchor = false) {
    return (
      <PlanCard
        planId={planId}
        cta={planCta(planId)}
        featured={planId === "GRAN_EMPRESA"}
        recommended={planId === "MEDIANA_EMPRESA" || planId === "VECINO"}
        highlighted={effectiveHighlight === planId}
        isAuthenticated={isAuthenticated}
        isPlanChange={isPlanChange}
        isCurrent={currentPlan === planId}
        withAnchor={withAnchor}
      />
    );
  }

  return (
    <div className="space-y-3 md:space-y-8">
      <div className="flex flex-wrap justify-center gap-1.5 md:gap-2">
        {FILTER_OPTIONS.map((opt) => {
          const active = activeFilters.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggleFilter(opt.id)}
              aria-pressed={active}
              className={`px-3 py-1.5 md:px-3.5 md:py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                active
                  ? "bg-[#27366D] text-white"
                  : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200/80"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {visiblePlans.length === 0 ? (
        <p className="text-center text-sm text-slate-500">
          Selecciona Personales y/o Comerciales para ver planes.
        </p>
      ) : (
        <>
          <PlanSwipeDeck
            planIds={visiblePlans}
            initialIndex={mobileStartIndex}
            renderCard={renderPlanCard}
          />

          <div className="hidden md:flex flex-wrap justify-center gap-5">
            {visiblePlans.map((planId) => (
              <div
                key={planId}
                className="w-full md:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] xl:w-[240px] max-w-[320px]"
              >
                {renderPlanCard(planId, true)}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PlanCard({
  planId,
  cta,
  featured,
  recommended,
  highlighted,
  isAuthenticated,
  isPlanChange,
  isCurrent,
  withAnchor = false,
}: {
  planId: MembershipPlan;
  cta: string;
  featured: boolean;
  recommended: boolean;
  highlighted: boolean;
  isAuthenticated: boolean;
  isPlanChange: boolean;
  isCurrent: boolean;
  withAnchor?: boolean;
}) {
  const plan = MEMBERSHIP_PLANS[planId];
  const useDirectSelect = isAuthenticated && (isPlanChange || plan.isPaid);
  const isEmphasized = featured || highlighted;
  const stopDrag = planDeckStopDragProps();

  return (
    <div
      id={withAnchor && planId === "GRAN_EMPRESA" ? "gran_empresa" : undefined}
      className={`flex flex-col rounded-xl border p-4 md:p-6 bg-white shadow-sm h-full scroll-mt-24 ${
        isEmphasized ? "border-amber-400 ring-2 ring-amber-400/40" : "border-slate-200"
      }`}
    >
      {isCurrent ? (
        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full self-start mb-1.5 md:mb-3">
          Tu plan actual
        </span>
      ) : featured ? (
        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full self-start mb-1.5 md:mb-3">
          Máxima exposición
        </span>
      ) : (
        recommended && (
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#27366D] bg-[#27366D]/10 px-2 py-0.5 rounded-full self-start mb-1.5 md:mb-3">
            Recomendado
          </span>
        )
      )}
      <h2 className="font-bold text-slate-950 text-sm leading-snug">{plan.label}</h2>
      <p className="text-base md:text-lg font-black text-[#27366D] mt-1 md:mt-2">
        {plan.isPaid ? formatPlanPriceMxn(planId as Parameters<typeof formatPlanPriceMxn>[0]) : "Gratis"}
      </p>
      <p className="text-[11px] text-amber-700 font-semibold mt-0.5 leading-snug">{plan.tagline}</p>
      <p className="hidden md:block text-xs text-slate-500 mt-3 mb-4 font-light leading-relaxed">
        {plan.description}
      </p>
      <ul className="space-y-1 md:space-y-2 mt-2.5 md:mt-0 mb-3 md:mb-6 flex-1">
        {plan.benefits.map((b) => (
          <li key={b} className="flex gap-2 text-[11px] text-slate-600 leading-snug">
            <Check className="w-3.5 h-3.5 text-[#27366D] shrink-0 mt-0.5" />
            {b}
          </li>
        ))}
      </ul>
      {plan.highlight && !isCurrent && (
        <p className="hidden md:block text-[10px] text-slate-400 font-medium mb-4 leading-snug">
          {plan.highlight}
        </p>
      )}
      {isCurrent ? (
        <span
          aria-disabled="true"
          className="block w-full text-center font-bold text-xs uppercase tracking-wider py-2.5 md:py-3 rounded-lg bg-slate-100 text-slate-400 border border-slate-200 cursor-default select-none"
        >
          Plan actual
        </span>
      ) : useDirectSelect ? (
        <div {...stopDrag}>
          <PlanSelectButton
            planId={planId}
            label={isPlanChange ? "Seleccionar" : cta}
            className={`block w-full text-center font-bold text-xs uppercase tracking-wider py-2.5 md:py-3 rounded-lg transition ${
              plan.isPaid
                ? planId === "GRAN_EMPRESA"
                  ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                  : "bg-[#27366D] hover:bg-[#1e2b58] text-white"
                : "bg-amber-500 hover:bg-amber-400 text-slate-950"
            }`}
          />
        </div>
      ) : (
        <Link
          href={registroUrl(planId)}
          {...stopDrag}
          className={`block text-center font-bold text-xs uppercase tracking-wider py-2.5 md:py-3 rounded-lg transition ${
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
