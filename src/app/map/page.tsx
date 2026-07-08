import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import { buildMapRoute } from "@/lib/mapRoute";
import MapRouteView from "./MapRouteView";
import { MapPageBusinessCta, MapPageGuides, MapPageIntro } from "./MapPageSections";

export const metadata = {
  title: "Ruta MAP | Barriando",
  description:
    "Recorre el Museo Abierto de Puebla (MAP) con una ruta peatonal optimizada por hitos patrimoniales y socios destacados.",
};

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const route = await buildMapRoute();

  return (
    <SiteShell>
      <Navbar />

      <main className="max-w-6xl mx-auto py-4 md:py-6 px-4 md:px-6">
        <MapRouteView route={route} />

        <MapPageIntro route={route} />
        <MapPageGuides />
        <MapPageBusinessCta />
      </main>

      <Footer />
    </SiteShell>
  );
}
