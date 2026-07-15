import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import PlanesCatalog, { type PlanAudienceFilter } from "./PlanesCatalog";
import { parsePlanSlug } from "@/lib/plan-routing";
import { getSession } from "@/lib/auth-utils";

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

  return (
    <SiteShell>
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto py-16 px-6 w-full">
        <div className="text-center mb-10">
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

        <PlanesCatalog
          isAuthenticated={Boolean(session)}
          isPlanChange={isPlanChange}
          highlightPlan={highlightPlan}
          initialFilters={initialFilters}
        />
      </main>
      <Footer />
    </SiteShell>
  );
}
