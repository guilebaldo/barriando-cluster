import HomePage from "./HomePage";
import { getCarouselSocios } from "@/lib/public-socios";
import { getLiveStats } from "@/lib/get-live-stats";
import { getPublishedTestimonials, getActiveHomePromo } from "@/lib/home-content";

export default async function Page() {
  const [carouselSocios, liveStats, testimonials, homePromo] = await Promise.all([
    getCarouselSocios(),
    getLiveStats(),
    getPublishedTestimonials(),
    getActiveHomePromo(),
  ]);

  return (
    <HomePage
      carouselSocios={carouselSocios}
      liveStats={liveStats}
      testimonials={testimonials}
      homePromo={homePromo}
    />
  );
}
