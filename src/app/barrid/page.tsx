import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import { getSession } from "@/lib/auth-utils";
import { loadUserStampSummaries } from "@/lib/pasaporte-stamps";
import { loadPanelUser } from "@/lib/panel-data";
import { listaHitos } from "../data/hitos";

export const dynamic = "force-dynamic";

export default async function BarrIdPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?callbackUrl=/barrid");
  }

  const user = await loadPanelUser(session.id);
  const summaries = await loadUserStampSummaries(session.id);
  const total = Math.max(1, listaHitos.length);
  const progress = Math.min(100, Math.round((summaries.length / total) * 100));

  return (
    <SiteShell>
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <section className="bg-[#27366D] text-white rounded-2xl p-7 md:p-8 border border-[#1e2b58]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Perfil BarrID</p>
          <div className="mt-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-200 shrink-0">
              {user?.image ? (
                <Image src={user.image} alt={session.nombre ?? "Perfil"} width={56} height={56} className="w-full h-full object-cover" unoptimized />
              ) : (
                <div className="w-full h-full bg-slate-300" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-black font-serif-cluster uppercase tracking-wide truncate">
                {session.nombre ?? "Mi BarrID"}
              </h1>
              <p className="text-xs text-slate-300 truncate">{session.email}</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-200">
              <span>Progreso en MAP</span>
              <span>{summaries.length}/{listaHitos.length}</span>
            </div>
            <div className="mt-2 h-2.5 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full bg-amber-400" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/map"
              className="inline-flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-lg transition"
            >
              Ver MAP
            </Link>
            <Link
              href="/pasaporte"
              className="inline-flex items-center justify-center border border-slate-300 text-white hover:bg-white/10 text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-lg transition"
            >
              Ver Pasaporte
            </Link>
            <Link
              href="/panel"
              className="inline-flex items-center justify-center border border-slate-300 text-white hover:bg-white/10 text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-lg transition"
            >
              Panel socio
            </Link>
            {session.role === "ADMIN" && (
              <Link
                href="/admin"
                className="inline-flex items-center justify-center border border-amber-300 text-amber-200 hover:bg-amber-300/10 text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-lg transition"
              >
                Panel admin
              </Link>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </SiteShell>
  );
}
