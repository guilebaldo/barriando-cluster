import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import PasaporteClient from "./PasaporteClient";
import { getSession } from "@/lib/auth-utils";
import {
  getParticipatingRestaurants,
  getPoblanoProgress,
  getPoblanoTier,
  restaurantSlug,
} from "@/lib/pasaporte";
import { countUserStamps, loadUserStampSummaries } from "@/lib/pasaporte-stamps";

export default async function PasaportePage() {
  const session = await getSession();
  const restaurants = getParticipatingRestaurants().map((r) => ({
    id: r.id,
    name: r.name,
    slug: restaurantSlug(r),
    foto: r.foto,
    categoria: r.categoria,
  }));

  let totalStamps = 0;
  let stampMap: Record<number, { count: number; lastStampAt: string }> = {};

  if (session) {
    const summaries = await loadUserStampSummaries(session.id);
    totalStamps = await countUserStamps(session.id);
    stampMap = Object.fromEntries(
      summaries.map((s) => [s.restaurantId, { count: s.count, lastStampAt: s.lastStampAt }])
    );
  }

  const tier = getPoblanoTier(totalStamps);
  const progress = getPoblanoProgress(totalStamps);

  return (
    <SiteShell>
      <Navbar />
      <main className="flex-1 w-full">
        <PasaporteClient
          userName={session?.nombre || session?.email || "Visitante"}
          isAuthenticated={Boolean(session)}
          restaurants={restaurants}
          stampMap={stampMap}
          totalStamps={totalStamps}
          tierLabel={tier.label}
          tierId={tier.id}
          progress={progress}
        />
      </main>
      <Footer />
    </SiteShell>
  );
}
