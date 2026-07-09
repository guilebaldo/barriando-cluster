import Navbar from "../components/Navbar";
import PasaporteClient from "./PasaporteClient";
import PasaporteImmersiveShell from "./PasaporteImmersiveShell";
import { getSession } from "@/lib/auth-utils";
import {
  getParticipatingRestaurants,
  getPassportProgress,
  getPassportRank,
  restaurantSlug,
} from "@/lib/pasaporte";
import { countUserStamps, loadUserStampSummaries } from "@/lib/pasaporte-stamps";
import { loadPanelUser } from "@/lib/panel-data";

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
  let userImage: string | null = null;

  if (session) {
    const [summaries, stampTotal, panelUser] = await Promise.all([
      loadUserStampSummaries(session.id),
      countUserStamps(session.id),
      loadPanelUser(session.id),
    ]);
    totalStamps = stampTotal;
    stampMap = Object.fromEntries(
      summaries.map((s) => [s.restaurantId, { count: s.count, lastStampAt: s.lastStampAt }])
    );
    userImage = panelUser?.image ?? null;
  }

  const uniqueStampedCount = Object.values(stampMap).filter((s) => s.count > 0).length;
  const rank = getPassportRank(uniqueStampedCount, restaurants.length);
  const progress = getPassportProgress(uniqueStampedCount, restaurants.length);

  return (
    <PasaporteImmersiveShell>
      <Navbar />
      <PasaporteClient
        userName={session?.nombre || session?.email || "Visitante"}
        userImage={userImage}
        isAuthenticated={Boolean(session)}
        restaurants={restaurants}
        stampMap={stampMap}
        totalStamps={totalStamps}
        uniqueStamped={uniqueStampedCount}
        totalRestaurants={restaurants.length}
        tierLabel={rank.label}
        tierId={rank.id}
        isPoblanoComplete={rank.isComplete}
        progress={progress}
      />
    </PasaporteImmersiveShell>
  );
}
