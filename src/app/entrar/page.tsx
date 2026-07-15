import Link from "next/link";
import { redirect } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import { getSession } from "@/lib/auth-utils";
import { ONBOARDING_CONTINUE_PATH } from "@/lib/plan-routing";
import { resolvePostAuthHomePath } from "@/lib/post-auth-home";

export const metadata = {
  title: "Entrar | Barriando",
  description: "Elige si deseas iniciar sesión o registrarte en Barriando.",
};

export default async function EntrarPage() {
  const session = await getSession();
  if (session) {
    redirect(
      resolvePostAuthHomePath({
        email: session.email,
        role: session.role,
        plan: session.plan,
        subscriptionStatus: session.subscriptionStatus,
      })
    );
  }

  return (
    <SiteShell>
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-14">
        <section className="text-center">
          <h1 className="text-3xl md:text-4xl font-black font-serif-cluster uppercase tracking-wide text-slate-950">
            Entrar a Barriando
          </h1>
          <p className="text-sm text-slate-600 mt-3 font-light max-w-xl mx-auto">
            Elige cómo quieres continuar.
          </p>
        </section>

        <section className="mt-10 grid md:grid-cols-2 gap-6">
          <article className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <LogIn className="w-5 h-5 text-[#27366D]" />
            <h2 className="mt-3 text-lg font-bold text-slate-900">Iniciar sesión</h2>
            <p className="mt-2 text-sm text-slate-600 font-light leading-relaxed">
              Si ya tienes cuenta, entra con Google. Te llevamos a tu espacio: MAP (turista), BarrID
              (vecino o admin), panel (negocio).
            </p>
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(ONBOARDING_CONTINUE_PATH)}`}
              className="mt-5 inline-flex items-center justify-center w-full bg-[#27366D] hover:bg-[#1e2b58] text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-lg transition"
            >
              Iniciar sesión
            </Link>
          </article>

          <article className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <UserPlus className="w-5 h-5 text-amber-600" />
            <h2 className="mt-3 text-lg font-bold text-slate-900">Registrarte</h2>
            <p className="mt-2 text-sm text-slate-600 font-light leading-relaxed">
              Si eres nuevo, comienza en Planes para elegir cómo sumarte al barrio.
            </p>
            <Link
              href="/planes"
              className="mt-5 inline-flex items-center justify-center w-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-lg transition"
            >
              Ir a Planes
            </Link>
          </article>
        </section>
      </main>
      <Footer />
    </SiteShell>
  );
}
