import HomePage from "./HomePage";
import { getCarouselSocios } from "@/lib/public-socios";

export default async function Page() {
  const carouselSocios = await getCarouselSocios();
  return <HomePage carouselSocios={carouselSocios} />;
}
