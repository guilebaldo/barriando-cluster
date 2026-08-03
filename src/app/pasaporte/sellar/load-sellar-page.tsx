import { redirect } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import SiteShell from "@/app/components/SiteShell";
import { getSession } from "@/lib/auth-utils";
import {
  buildPasaportePendingStampPath,
  findRestaurantBySlugAsync,
} from "@/lib/pasaporte";
import { resolveSocioMapCoord } from "@/lib/socio-map-coords";
import SellarClient from "./SellarClient";

/** Lógica compartida por `/pasaporte/sellar/[slug]` y el fallback `?restaurante=`. */
export async function loadSellarPage(rawSlug: string) {
  const slug = decodeURIComponent(rawSlug ?? "").trim();

  if (!slug) {
    redirect("/pasaporte?error=restaurante_requerido");
  }

  const session = await getSession();

  if (!session) {
    redirect(buildPasaportePendingStampPath(slug));
  }

  const restaurant = await findRestaurantBySlugAsync(slug);
  if (!restaurant) {
    redirect("/pasaporte?error=invalid_restaurant");
  }

  const requiresLocation = Boolean(resolveSocioMapCoord(restaurant));

  return (
    <SiteShell>
      <Navbar />
      <SellarClient
        restaurantSlug={slug}
        restaurantName={restaurant.name}
        requiresLocation={requiresLocation}
      />
      <div className="hidden md:block">
        <Footer />
      </div>
    </SiteShell>
  );
}
