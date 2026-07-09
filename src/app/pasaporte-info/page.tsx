import { redirect } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import { getSession } from "@/lib/auth-utils";
import PasaporteGoogleCta from "./PasaporteGoogleCta";

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
            <PasaporteGoogleCta />
          </div>
        </section>
      </main>
      <Footer />
    </SiteShell>
  );
}
