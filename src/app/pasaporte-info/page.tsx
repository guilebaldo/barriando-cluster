import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import { getSession } from "@/lib/auth-utils";

export const metadata = {
  title: "Abre tu Pasaporte | Barriando",
  description:
    "Identifícate con Google para entrar directo a tu Pasaporte y ver tus sellos.",
};

export default async function PasaporteInfoPage() {
  const session = await getSession();
  if (session) redirect("/pasaporte");

  return (
    <SiteShell>
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 w-full flex items-center">
        <section className="w-full bg-[#27366D] text-white rounded-2xl p-8 md:p-10 border border-[#1e2b58] text-center">
          <h1 className="text-3xl md:text-4xl font-black font-serif-cluster uppercase tracking-wide">
            Abre tu Pasaporte
          </h1>
          <p className="mt-3 text-sm text-slate-200 font-light leading-relaxed max-w-xl mx-auto">
            Guarda tus sellos del MAP, sigue tu progreso en temporada y desbloquea recompensas del barrio.
            Continúa con Google para crear o activar tu cuenta en un solo paso.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/login?callbackUrl=/pasaporte"
              className="inline-flex items-center gap-3 bg-white hover:bg-slate-100 text-slate-900 text-sm font-bold px-6 py-3.5 rounded-lg transition active:scale-[0.98]"
            >
              <svg viewBox="0 0 24 24" aria-hidden className="w-5 h-5">
                <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.2-1.9 2.9l3 2.3c1.8-1.6 2.8-3.9 2.8-6.8 0-.7-.1-1.4-.2-2H12z" />
                <path fill="#34A853" d="M12 21c2.7 0 4.9-.9 6.5-2.5l-3-2.3c-.8.6-1.9 1-3.5 1-2.7 0-4.9-1.8-5.7-4.2l-3.1 2.4C4.9 18.8 8.2 21 12 21z" />
                <path fill="#4A90E2" d="M6.3 13c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2L3.2 6.6C2.4 8 2 9.5 2 11s.4 3 1.2 4.4L6.3 13z" />
                <path fill="#FBBC05" d="M12 4.8c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 1.9 14.7 1 12 1 8.2 1 4.9 3.2 3.2 6.6L6.3 9c.8-2.4 3-4.2 5.7-4.2z" />
              </svg>
              Continuar con Google
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </SiteShell>
  );
}
