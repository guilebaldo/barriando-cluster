import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { buildMapRoute } from "@/lib/mapRoute";
import MapImmersiveShell from "./MapImmersiveShell";
import MapRouteView from "./MapRouteView";

export const metadata = {
  title: "MAPA | Barriando",
  description: "Recorre el Museo Abierto de Puebla y Alrededores con mapa interactivo y ruta peatonal.",
};

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const route = await buildMapRoute();

  return (
    <MapImmersiveShell>
      <Navbar />
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <MapRouteView route={route} />
      </main>
      <div className="hidden lg:block shrink-0">
        <Footer compact />
      </div>
    </MapImmersiveShell>
  );
}
