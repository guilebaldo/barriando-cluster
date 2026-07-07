import HomePage from "./HomePage";
import { getLiveStats } from "@/lib/get-live-stats";
import { getActiveHomePromo } from "@/lib/home-content";
import { getCarouselSocios } from "@/lib/public-socios";

export default async function Page() {
  const [liveStats, homePromo, carouselSocios] = await Promise.all([
    getLiveStats(),
    getActiveHomePromo(),
    getCarouselSocios(),
  ]);

  return <HomePage liveStats={liveStats} homePromo={homePromo} carouselSocios={carouselSocios} />;
}
