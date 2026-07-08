import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import { getSession } from "@/lib/auth-utils";

export const metadata = {
  title: "Pasaporte Digital del Barrio | Barriando",
  description:
    "Conoce cómo funciona el Pasaporte Digital del Barrio: sellos QR con validación GPS, niveles y ediciones limitadas de temporada.",
};

export default async function PasaporteInfoPage() {
  const session = await getSession();
  if (session) redirect("/pasaporte");

  return (
    <SiteShell>
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto px-6 py-14 w-full">
        <section className="bg-[#27366D] text-white rounded-2xl p-8 md:p-10 border border-[#1e2b58]">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-400">Tu identificación en el barrio</p>
          <h1 className="text-3xl md:text-4xl font-black font-serif-cluster uppercase tracking-wide mt-3">
            Pasaporte Digital del Barrio
          </h1>
          <p className="mt-4 text-sm text-slate-200 max-w-2xl font-light leading-relaxed">
            El Pasaporte es tu identificación dentro del ecosistema Barriando. Inicia sesión o crea una cuenta
            gratuita para activarlo y empezar a coleccionar sellos en el MAP.
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-6 mt-8">
          <article className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-sm font-bold text-[#27366D] uppercase tracking-widest">Cómo funciona</h2>
            <ol className="mt-4 text-sm text-slate-600 font-light space-y-3 leading-relaxed list-decimal list-inside">
              <li>Te registras gratis en plan Turista.</li>
              <li>Abres el MAP y eliges la ruta peatonal por el Centro Histórico.</li>
              <li>En cada punto certificado escaneas QR oficiales.</li>
              <li>La validación GPS confirma tu visita real para emitir el sello.</li>
            </ol>
          </article>

          <article className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-sm font-bold text-[#27366D] uppercase tracking-widest">Niveles y recompensas</h2>
            <p className="mt-4 text-sm text-slate-600 font-light leading-relaxed">
              Tu progreso se acumula por cantidad y variedad de sellos. A mayor nivel, desbloqueas reconocimientos,
              dinámicas especiales y beneficios en comercios del ecosistema.
            </p>
            <p className="mt-3 text-sm text-slate-600 font-light leading-relaxed">
              También existen ediciones limitadas de temporada (Todos Santos, Navidad y festividades locales)
              con sellos exclusivos y vigencia temporal.
            </p>
          </article>
        </section>

        <section className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-7 text-center">
          <h3 className="text-xl font-black text-slate-900 font-serif-cluster uppercase tracking-wide">
            Activa tu Pasaporte
          </h3>
          <p className="text-sm text-slate-700 mt-3 max-w-2xl mx-auto font-light">
            Si ya tienes cuenta, inicia sesión. Si eres nuevo, regístrate gratis como Turista y comienza a
            coleccionar sellos en el MAP.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login?callbackUrl=/pasaporte"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-[#27366D] hover:bg-[#1e2b58] text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-lg transition"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro?plan=turista"
              className="w-full sm:w-auto inline-flex items-center justify-center border border-[#27366D] text-[#27366D] hover:bg-[#27366D]/5 text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-lg transition"
            >
              Crear cuenta gratis
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </SiteShell>
  );
}
