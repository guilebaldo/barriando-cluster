import { redirect } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import PasaporteClient from "./PasaporteClient";
import PasaporteImmersiveShell from "./PasaporteImmersiveShell";
import { getSession } from "@/lib/auth-utils";
import {
  buildSellarPath,
  getParticipatingRestaurantsAsync,
  getPassportProgress,
  getPassportRank,
  restaurantSlug,
} from "@/lib/pasaporte";
import { countUserStamps, loadUserStampSummaries } from "@/lib/pasaporte-stamps";
import { loadPanelUser } from "@/lib/panel-data";

export default async function PasaportePage({
  searchParams,
}: {
  searchParams: Promise<{ pendiente?: string }>;
}) {
  const session = await getSession();
  const params = await searchParams;
  const pendiente = params.pendiente?.trim();

  // Already signed in with a pending stamp from a QR scan — complete it.
  if (session && pendiente) {
    redirect(buildSellarPath(pendiente));
  }

  const participating = await getParticipatingRestaurantsAsync();

  // Preferential guest stamp demo: Mediana Empresa roster members that are AyB stamp targets.
  const featuredPreviewStampIds = participating
    .filter((r) => r.membershipPlan === "MEDIANA_EMPRESA")
    .sort((a, b) => a.name.localeCompare(b.name, "es"))
    .map((r) => r.id);

  /** Dispersa Mediana entre el resto para que no queden todos juntos en la rejilla. */
  function interleaveFeaturedStamps<T extends { id: number; membershipPlan?: string | null }>(
    list: T[]
  ): T[] {
    const featured = list.filter((r) => r.membershipPlan === "MEDIANA_EMPRESA");
    const rest = list.filter((r) => r.membershipPlan !== "MEDIANA_EMPRESA");
    if (featured.length === 0) return list;

    const out: T[] = [];
    let fi = 0;
    let ri = 0;
    // 2 “vacíos” (o no-mediana) por cada sello destacado → se ven salteados.
    while (fi < featured.length || ri < rest.length) {
      for (let k = 0; k < 2 && ri < rest.length; k++) {
        out.push(rest[ri++]);
      }
      if (fi < featured.length) out.push(featured[fi++]);
    }
    return out;
  }

  const restaurantsSorted =
    session != null
      ? participating
      : interleaveFeaturedStamps(
          [...participating].sort((a, b) => a.name.localeCompare(b.name, "es"))
        );

  const restaurants = restaurantsSorted.map((r) => ({
    id: r.id,
    name: r.name,
    slug: restaurantSlug(r),
    foto: r.foto,
    categoria: r.categoria,
    logoUrl: r.logoUrl ?? null,
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

  const isAuthenticated = Boolean(session);
  const client = (
    <PasaporteClient
      userName={session?.nombre || session?.email || "Visitante"}
      userImage={userImage}
      isAuthenticated={isAuthenticated}
      usePageScroll={!isAuthenticated}
      restaurants={restaurants}
      featuredPreviewStampIds={featuredPreviewStampIds}
      stampMap={stampMap}
      totalStamps={totalStamps}
      uniqueStamped={uniqueStampedCount}
      totalRestaurants={restaurants.length}
      tierLabel={rank.label}
      tierId={rank.id}
      isPoblanoComplete={rank.isComplete}
      progress={progress}
    />
  );

  if (isAuthenticated) {
    return (
      <PasaporteImmersiveShell>
        <Navbar />
        {client}
      </PasaporteImmersiveShell>
    );
  }

  return (
    <SiteShell className="bg-[#e8e0d0]">
      <Navbar />
      <main className="flex-1 w-full">{client}</main>
      <Footer />
    </SiteShell>
  );
}
