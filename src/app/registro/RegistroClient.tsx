"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import { OAuthButtons } from "../components/OAuthButtons";
import { MEMBERSHIP_PLANS, formatPlanPriceMxn } from "@/lib/membresia";
import { getUpgradePitch } from "@/lib/plan-upgrade";
import { registroUrl, planToSlug } from "@/lib/plan-routing";
import type { MembershipPlan } from "@/generated/prisma/client";
import { ArrowUpCircle, Check } from "lucide-react";

interface RegistroClientProps {
  plan: MembershipPlan;
  /** Sesión activa: solo mira el plan; el home sigue siendo MAPA hasta pagar. */
  alreadyLoggedIn?: boolean;
}

export default function RegistroClient({
  plan,
  alreadyLoggedIn = false,
}: RegistroClientProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const planDef = MEMBERSHIP_PLANS[plan];
  const isTurista = plan === "TURISTA";
  const upgradePitch = !isTurista ? getUpgradePitch(plan) : null;
  const planSlug = planToSlug(plan);
  const continueWithPlan = `/api/onboarding/continue?plan=${planSlug}`;
  const loginHref = `/login?plan=${planSlug}&callbackUrl=${encodeURIComponent(continueWithPlan)}`;

  async function handleActivatePlan() {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("plan", planSlug);
      const res = await fetch("/api/onboarding/select-plan", {
        method: "POST",
        body: form,
      });
      const data = (await res.json().catch(() => ({}))) as { path?: string; error?: string };
      if (!res.ok || !data.path) {
        throw new Error(data.error || "No se pudo continuar con el plan.");
      }
      router.push(data.path);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo continuar.");
      setBusy(false);
    }
  }

  return (
    <SiteShell>
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12 px-6 w-full pb-[calc(3.5rem+env(safe-area-inset-bottom,0px)+1.5rem)] md:pb-12">
        <div className="w-full max-w-md">
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
            <div className="mb-6 text-center">
              <h1 className="text-xl font-bold font-serif-cluster uppercase tracking-wide text-slate-950">
                {planDef.label}
              </h1>
              <p className="text-lg font-black text-[#27366D] mt-1.5">
                {planDef.isPaid
                  ? formatPlanPriceMxn(plan as Parameters<typeof formatPlanPriceMxn>[0])
                  : "Gratis"}
              </p>
              <p className="text-[11px] text-amber-700 font-semibold mt-1 leading-snug">
                {planDef.tagline}
              </p>
              <p className="text-xs text-slate-500 mt-3 font-light leading-relaxed">
                {planDef.description}
              </p>
              {alreadyLoggedIn && !isTurista ? (
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                  Tu espacio sigue siendo el MAPA hasta que actives el pago.
                </p>
              ) : null}
            </div>

            <ul className="space-y-1.5 mb-4 text-left">
              {planDef.benefits.map((b) => (
                <li key={b} className="flex gap-2 text-[11px] text-slate-600 leading-snug">
                  <Check className="w-3.5 h-3.5 text-[#27366D] shrink-0 mt-0.5" />
                  {b}
                </li>
              ))}
            </ul>

            {planDef.highlight ? (
              <p className="text-[10px] text-slate-400 font-medium mb-5 leading-snug text-center">
                {planDef.highlight}
              </p>
            ) : (
              <div className="mb-5" />
            )}

            {alreadyLoggedIn ? (
              <div className="space-y-3">
                {!isTurista ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleActivatePlan()}
                    className="w-full inline-flex items-center justify-center bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold uppercase tracking-wider px-5 py-3.5 rounded-lg transition"
                  >
                    {busy ? "Continuando…" : "Continuar al pago"}
                  </button>
                ) : null}
                <Link
                  href="/mapa"
                  className="w-full inline-flex items-center justify-center border border-[#27366D]/20 text-[#27366D] text-xs font-bold uppercase tracking-wider px-5 py-3.5 rounded-lg hover:bg-slate-50 transition"
                >
                  Volver al MAPA
                </Link>
                {error ? (
                  <p className="text-[11px] text-red-700 text-center bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </p>
                ) : null}
              </div>
            ) : (
              <OAuthButtons plan={plan} />
            )}

            {upgradePitch && (
              <div className="mt-8 rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-white p-5">
                <div className="flex items-start gap-3">
                  <ArrowUpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-[#27366D]">
                      ¿Necesitas más visibilidad? Conoce {upgradePitch.label}
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {upgradePitch.benefits.map((b) => (
                        <li key={b} className="text-[11px] text-slate-600 leading-relaxed">
                          · {b}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={registroUrl(upgradePitch.nextPlan)}
                      className="inline-flex mt-4 items-center justify-center w-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg transition-all"
                    >
                      Ver plan {upgradePitch.label}
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {!alreadyLoggedIn ? (
              <p className="text-xs text-slate-500 mt-6 text-center">
                ¿Ya tienes cuenta?{" "}
                <Link
                  href={loginHref}
                  className="text-[#27366D] font-bold hover:text-red-800 active:text-red-900 transition-colors"
                >
                  Inicia sesión
                </Link>
              </p>
            ) : null}
          </div>
        </div>
      </main>
      <Footer />
    </SiteShell>
  );
}
