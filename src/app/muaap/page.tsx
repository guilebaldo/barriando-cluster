import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import { buildMuaapRoute } from "@/lib/muaapRoute";
import MuaapRouteView from "./MuaapRouteView";
import { Compass, Route } from "lucide-react";

export const metadata = {
  title: "Ruta MUAAP | Barriando",
  description:
    "Recorre el Museo Urbano Andante Abierto de Puebla con una ruta peatonal optimizada por hitos patrimoniales y negocios premium Gran Empresa.",
};

export const dynamic = "force-dynamic";

export default async function MuaapPage() {
  const route = await buildMuaapRoute();

  return (
    <SiteShell>
      <Navbar />

      <header className="bg-[#27366D] text-white py-14 px-6 border-b border-[#1e2b58]">
        <div className="max-w-6xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
            <Route className="w-3.5 h-3.5" />
            Ruta automatizada
          </span>
          <h1 className="text-3xl md:text-4xl font-black font-serif-cluster mt-4 mb-3 uppercase tracking-wide">
            Museo Urbano Andante Abierto de Puebla
          </h1>
          <p className="text-slate-200 text-sm max-w-2xl mx-auto font-light leading-relaxed">
            Circuito peatonal inteligente con{" "}
            <strong className="text-white">{route.milestoneCount} hitos patrimoniales</strong>
            {route.premiumCount > 0 && (
              <>
                {" "}
                y{" "}
                <strong className="text-amber-400">{route.premiumCount} negocios Gran Empresa</strong>
              </>
            )}
            . El algoritmo ordena cada parada para caminar el Centro Histórico de forma fluida.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-10 px-6">
        <MuaapRouteView route={route} />

        <section className="mt-10 grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Compass className="w-4 h-4 text-[#27366D]" />
              <h2 className="text-sm font-bold text-[#27366D] uppercase tracking-widest">
                ¿Cómo funciona?
              </h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed font-light">
              Partimos del <strong>Teatro Principal</strong> y aplicamos el algoritmo de{" "}
              <em>vecino más cercano</em> (Haversine) para unir hitos históricos verificados. Los
              negocios del Clúster con plan <strong>Gran Empresa</strong> activo se integran al mapa
              como paradas premium — beneficio exclusivo de esa membresía.
            </p>
          </div>
          <div className="bg-gradient-to-br from-[#27366D] to-[#1e2b58] text-white rounded-2xl p-6 border border-amber-400/20">
            <h2 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-3">
              Pasaporte digital
            </h2>
            <p className="text-sm text-slate-200 leading-relaxed font-light mb-4">
              Visita los establecimientos de la ruta y colecciona sellos de Chiles en Nogada en tu
              pasaporte Barriando.
            </p>
            <a
              href="/pasaporte"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition"
            >
              🎟️ Mi Pasaporte
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </SiteShell>
  );
}
