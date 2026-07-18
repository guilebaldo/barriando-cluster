import HomePage from "../HomePage";
import { getLiveStats } from "@/lib/get-live-stats";
import { getActiveHomePromo } from "@/lib/home-content";
import { getCarouselSocios } from "@/lib/public-socios";

export const metadata = {
  title: "Barriando — Clúster Turístico del Centro Histórico de Puebla",
  description:
    "Barriando articula empresas del Centro Histórico de Puebla para desarrollar productos y servicios turísticos, festivales y derrama económica local.",
};

/** Presentación pública de Barriando (video, MAP, pasaporte, socios). */
export default async function LandingPage() {
  const [liveStats, homePromo, carouselSocios] = await Promise.all([
    getLiveStats(),
    getActiveHomePromo(),
    getCarouselSocios(),
  ]);

  return <HomePage liveStats={liveStats} homePromo={homePromo} carouselSocios={carouselSocios} />;
}
