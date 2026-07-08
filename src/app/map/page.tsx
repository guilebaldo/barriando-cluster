import Navbar from "../components/Navbar";
import SiteShell from "../components/SiteShell";
import { buildMapRoute } from "@/lib/mapRoute";
import MapRouteView from "./MapRouteView";

export const metadata = {
  title: "MAP | Barriando",
  description: "Recorre el Museo Abierto de Puebla con mapa interactivo y ruta peatonal.",
};

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const route = await buildMapRoute();

  return (
    <SiteShell className="bg-white h-[100dvh] overflow-hidden">
      <Navbar />
      <main className="flex-1 min-h-0 flex flex-col">
        <MapRouteView route={route} />
      </main>
    </SiteShell>
  );
}
