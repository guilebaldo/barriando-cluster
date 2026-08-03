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
import SellarClient from "../SellarClient";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function SellarSlugPage({ params }: Props) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug ?? "").trim();

  if (!slug) {
    redirect("/pasaporte?error=restaurante_requerido");
  }

  const session = await getSession();

  if (!session) {
    // Guest: ficha del pasaporte + CTA Google, luego retoma el sello.
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
