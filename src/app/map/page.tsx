import Navbar from "../components/Navbar";
import { buildMapRoute } from "@/lib/mapRoute";
import MapImmersiveShell from "./MapImmersiveShell";
import MapRouteView from "./MapRouteView";

export const metadata = {
  title: "MAP | Barriando",
  description: "Recorre el Museo Abierto de Puebla con mapa interactivo y ruta peatonal.",
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
    </MapImmersiveShell>
  );
}
