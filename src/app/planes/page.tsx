import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { MEMBERSHIP_PLANS, PAID_PLANS } from "@/lib/membresia";
import { registroUrl } from "@/lib/plan-routing";
import { Check } from "lucide-react";

export default function PlanesPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Navbar />
      <main className="max-w-5xl mx-auto py-16 px-6">
        <div className="text-center mb-12">
          <span className="text-[#27366D] font-bold text-xs uppercase tracking-widest">Membresías</span>
          <h1 className="text-3xl md:text-4xl font-extrabold mt-2 font-serif-cluster uppercase tracking-wide text-slate-950">
            Elige cómo sumarte al Barrio
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto mt-3 font-light">
            Desde la comunidad gratuita hasta la certificación comercial para negocios exclusivos del Clúster
            Barriando en el Centro Histórico de Puebla.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          <PlanCard planId="VECINO" cta="Empezar Gratis" href={registroUrl("VECINO")} featured={false} />

          {PAID_PLANS.map((planId) => (
            <PlanCard
              key={planId}
              planId={planId}
              cta="Elegir Plan"
              href={registroUrl(planId)}
              featured={planId === "NEGOCIO_FAMILIAR"}
            />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function PlanCard({
  planId,
  cta,
  href,
  featured,
}: {
  planId: keyof typeof MEMBERSHIP_PLANS;
  cta: string;
  href: string;
  featured: boolean;
}) {
  const plan = MEMBERSHIP_PLANS[planId];

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
      <Link
        href={href}
        className={`block text-center font-bold text-xs uppercase tracking-wider py-3 rounded-lg transition ${
          plan.isPaid
            ? "bg-[#27366D] hover:bg-[#1e2b58] text-white"
            : "bg-amber-500 hover:bg-amber-400 text-slate-950"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}
