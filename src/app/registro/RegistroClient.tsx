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
import { ArrowUpCircle, MapPin, UserPlus } from "lucide-react";

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
            <div className="flex flex-col items-center text-center gap-2 mb-6">
              <UserPlus className="w-6 h-6 text-[#27366D]" />
              <h1 className="text-xl font-bold font-serif-cluster uppercase tracking-wide">
                {isTurista
                  ? "Regístrate como Turista"
                  : alreadyLoggedIn
                    ? `Membresía ${planDef.label}`
                    : "Únete a Barriando"}
              </h1>
              <p className="text-xs text-slate-500 font-light leading-relaxed">
                {isTurista
                  ? "Acceso gratuito al Pasaporte MAPA, rutas peatonales y novedades del Centro Histórico."
                  : alreadyLoggedIn
                    ? "Revisa los beneficios. Tu espacio sigue siendo el MAPA hasta que actives el pago."
                    : "Tras iniciar sesión (Google o enlace de verificación) continuarás a la selección de método de pago para activar tu plan."}
              </p>
            </div>

            {isTurista ? (
              <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-4 text-center">
                <MapPin className="w-5 h-5 text-amber-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-900">Perfil Turista · Gratis</p>
                <p className="text-xs text-slate-600 mt-2 font-light leading-relaxed">
                  Explora Puebla, colecciona sellos de temporada y guarda tu progreso en la nube.
                </p>
              </div>
            ) : (
              <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#27366D] mb-1">
                  Plan seleccionado
                </p>
                <p className="text-sm font-bold text-slate-900">{planDef.label}</p>
                <p className="text-lg font-black text-[#27366D] mt-1">
                  {formatPlanPriceMxn(plan as Parameters<typeof formatPlanPriceMxn>[0])}
                </p>
                <p className="text-xs text-slate-600 mt-2 font-light leading-relaxed">
                  {planDef.description}
                </p>
                {planDef.benefits?.length ? (
                  <ul className="mt-3 space-y-1 text-left">
                    {planDef.benefits.map((b) => (
                      <li key={b} className="text-[11px] text-slate-600 leading-relaxed">
                        · {b}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
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
