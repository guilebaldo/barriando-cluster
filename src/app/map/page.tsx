import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import { buildMapRoute } from "@/lib/mapRoute";
import MapRouteView from "./MapRouteView";
import { Compass, Route } from "lucide-react";

export const metadata = {
  title: "Ruta MAP | Barriando",
  description:
    "Recorre el Museo Abierto de Puebla (MAP) con una ruta peatonal optimizada por hitos patrimoniales y negocios premium Gran Empresa.",
};

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const route = await buildMapRoute();

  return (
    <SiteShell>
      <Navbar />

      <header className="bg-[#27366D] text-white py-14 px-6 border-b border-[#1e2b58]">
        <div className="max-w-6xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
            <Route className="w-3.5 h-3.5" />
            Ruta peatonal
          </span>
          <h1 className="text-3xl md:text-4xl font-black font-serif-cluster mt-4 mb-3 uppercase tracking-wide">
            Museo Abierto de Puebla
          </h1>
          <p className="text-slate-200 text-sm max-w-2xl mx-auto font-light leading-relaxed">
            Circuito en cuadrante con{" "}
            <strong className="text-white">{route.milestoneCount} hitos patrimoniales</strong>
            {route.premiumCount > 0 && (
              <>
                {" "}
                y{" "}
                <strong className="text-amber-400">{route.premiumCount} negocios Gran Empresa</strong>
              </>
            )}
            . Orden optimizado para caminar sin depender del sentido vehicular.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-10 px-6">
        <MapRouteView route={route} />

        <section className="mt-10 grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Compass className="w-4 h-4 text-[#27366D]" />
              <h2 className="text-sm font-bold text-[#27366D] uppercase tracking-widest">
                ¿Cómo funciona?
              </h2>
            </div>
            <ol className="text-sm text-slate-600 leading-relaxed font-light space-y-3 list-decimal list-inside">
              <li>
                El sistema utiliza el <strong className="text-slate-800">GPS en tiempo real</strong> de tu
                celular para detectar tu ubicación y preseleccionar automáticamente el hito del MAP más
                cercano, para que inicies tu recorrido sin complicaciones.
              </li>
              <li>
                Los <strong className="text-slate-800">hitos históricos</strong> (iglesias, museos y
                monumentos) tendrán códigos QR oficiales en sus entradas o fachadas para certificar tu
                visita en el pasaporte.
              </li>
              <li>
                Los <strong className="text-slate-800">establecimientos certificados</strong> entregarán su
                código QR al comensal al finalizar su consumo.
              </li>
              <li>
                <strong className="text-amber-700">¡Edición Especial de Temporada!</strong> Los sellos de
                Chiles en Nogada son exclusivos de la temporada y se entregan junto con el platillo. Lucen un
                color <strong className="text-amber-600">dorado</strong> único, como homenaje al capeado de
                huevo barroco que representaba el oro. Al concluir la temporada, esos QR especiales salen de
                circulación y los establecimientos vuelven al código QR estándar disponible todo el año.
              </li>
            </ol>
          </div>
          <div className="bg-gradient-to-br from-[#27366D] to-[#1e2b58] text-white rounded-2xl p-6 border border-amber-400/20">
            <h2 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-3">
              Pasaporte MAP
            </h2>
            <p className="text-sm text-slate-200 leading-relaxed font-light mb-4">
              Visita los restaurantes de la temporada y colecciona sellos de Chiles en Nogada. Completa
              todos para coronarte como <strong className="text-amber-400">Poblano</strong>.
            </p>
            <a
              href="/pasaporte"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition-all"
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
