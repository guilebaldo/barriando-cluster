import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import PasaporteClient from "./PasaporteClient";
import { getSession } from "@/lib/auth-utils";
import {
  getParticipatingRestaurants,
  getPassportProgress,
  getPassportRank,
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

  const uniqueStamped = Object.values(stampMap).filter((s) => s.count > 0).length;
  const rank = getPassportRank(uniqueStamped, restaurants.length);
  const progress = getPassportProgress(uniqueStamped, restaurants.length);

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
          tierLabel={rank.label}
          tierId={rank.id}
          isPoblanoComplete={rank.isComplete}
          progress={progress}
        />
      </main>
      <Footer />
    </SiteShell>
  );
}
