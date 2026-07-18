import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PlanesShell from "./PlanesShell";
import PlanesCatalog, { type PlanAudienceFilter } from "./PlanesCatalog";
import { parsePlanSlug } from "@/lib/plan-routing";
import { getSession } from "@/lib/auth-utils";
import { hasCommercialAccess, isTuristaPlan } from "@/lib/membresia";
import type { MembershipPlan } from "@/generated/prisma/client";

function parseAudienceFilters(raw?: string | null): PlanAudienceFilter[] {
  if (!raw?.trim()) return [];
  const parts = raw
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  const out: PlanAudienceFilter[] = [];
  for (const p of parts) {
    if (p === "personales" || p === "personal") out.push("personales");
    if (p === "comerciales" || p === "comercial" || p === "empresa") out.push("comerciales");
  }
  return Array.from(new Set(out));
}

export default async function PlanesPage({
  searchParams,
}: {
  searchParams: Promise<{ cambio?: string; plan?: string; tipo?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  const isPlanChange = params.cambio === "1" && Boolean(session);
  const highlightPlan = parsePlanSlug(params.plan);
  const initialFilters = parseAudienceFilters(params.tipo);

  // Plan vigente: Turista siempre cuenta; los de pago solo con membresía activa.
  const currentPlan: MembershipPlan | null =
    session &&
    (isTuristaPlan(session.plan) || hasCommercialAccess(session.plan, session.subscriptionStatus))
      ? session.plan
      : null;

  return (
    <PlanesShell>
      <Navbar />
      <main className="flex-1 flex flex-col min-h-0 max-w-5xl mx-auto w-full px-5 pt-4 pb-0 md:block md:px-6 md:py-16 md:overflow-visible overflow-hidden">
        <div className="text-center shrink-0 mb-3 md:mb-10">
          <span className="text-[#27366D] font-bold text-[11px] md:text-xs uppercase tracking-[0.2em]">
            Membresías
          </span>
          <h1 className="text-2xl md:text-4xl font-extrabold mt-2 font-serif-cluster uppercase tracking-wide text-slate-950 leading-tight">
            {isPlanChange ? "Cambia tu plan" : "Elige tu lugar en el Barrio"}
          </h1>
          <p className="hidden md:block text-sm text-slate-600 max-w-2xl mx-auto mt-3 font-light leading-relaxed">
            {isPlanChange
              ? "Selecciona un nuevo plan. Continuarás al método de pago sin volver a iniciar sesión."
              : "Empieza gratis, desbloquea BarrID como Vecino o certifica tu negocio. Cada nivel suma exposición real en el Centro Histórico."}
          </p>
          {isPlanChange && (
            <Link
              href="/certificacion/pago"
              className="inline-block mt-2 md:mt-4 text-xs text-[#27366D] hover:underline"
            >
              ← Volver al pago
            </Link>
          )}
        </div>

        <PlanesCatalog
          isAuthenticated={Boolean(session)}
          isPlanChange={isPlanChange}
          highlightPlan={highlightPlan}
          initialFilters={initialFilters}
          currentPlan={currentPlan}
        />
      </main>
      <div className="hidden md:block">
        <Footer />
      </div>
    </PlanesShell>
  );
}
