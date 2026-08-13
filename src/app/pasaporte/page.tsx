import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import PasaporteClient from "./PasaporteClient";
import PasaporteImmersiveShell from "./PasaporteImmersiveShell";
import { getSession } from "@/lib/auth-utils";
import {
  findRestaurantBySlugAsync,
  getParticipatingRestaurantsAsync,
  getPassportProgress,
  getPassportRank,
  restaurantSlug,
} from "@/lib/pasaporte";
import {
  getFeaturedPassportPreviewIds,
  scatterFeaturedPassportStamps,
} from "@/lib/passport-preview-layout";
import { countUserStamps, loadPassportLeaderNames, loadUserStampSummaries } from "@/lib/pasaporte-stamps";
import { loadPanelUser } from "@/lib/panel-data";
import { isFirstLoginAccount } from "@/lib/add-to-home-screen";
import { canOfferPassportStamp } from "@/lib/plan-visibility";
import { resolveSocioMapCoord } from "@/lib/socio-map-coords";
import type { MembershipPlan } from "@/generated/prisma/client";

export default async function PasaportePage({
  searchParams,
}: {
  searchParams: Promise<{ pendiente?: string }>;
}) {
  const session = await getSession();
  const params = await searchParams;
  const pendiente = params.pendiente?.trim() ?? "";

  // Logueado + QR: sello en esta misma página (sin redirect a /sellar → Safari negro).
  let pendingConfirm: {
    slug: string;
    name: string;
    requiresLocation: boolean;
  } | null = null;

  if (session && pendiente) {
    const restaurant = await findRestaurantBySlugAsync(pendiente);
    if (restaurant) {
      pendingConfirm = {
        slug: pendiente,
        name: restaurant.name,
        requiresLocation: Boolean(resolveSocioMapCoord(restaurant)),
      };
    }
  }

  const participating = await getParticipatingRestaurantsAsync();
  const leaderNamesPromise = loadPassportLeaderNames(10);

  // Guest stamp demo: Mediana + Gran Empresa AyB, scattered across the grid.
  const featuredPreviewStampIds = getFeaturedPassportPreviewIds(participating);

  const restaurantsSorted =
    session != null
      ? participating
      : scatterFeaturedPassportStamps(
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
  let userId: string | null = null;
  let isFirstLoginUser = false;
  let alreadyOnPassportRoster = false;
  let leaderNames: string[] = [];

  if (session) {
    const [summaries, stampTotal, panelUser, ranking] = await Promise.all([
      loadUserStampSummaries(session.id),
      countUserStamps(session.id),
      loadPanelUser(session.id),
      leaderNamesPromise,
    ]);
    leaderNames = ranking;
    totalStamps = stampTotal;
    stampMap = Object.fromEntries(
      summaries.map((s) => [s.restaurantId, { count: s.count, lastStampAt: s.lastStampAt }])
    );
    userImage = panelUser?.image ?? null;
    userId = session.id;
    isFirstLoginUser = isFirstLoginAccount(panelUser?.createdAt);
    const dbPlan = (panelUser?.subscription?.plan ?? session.plan) as MembershipPlan;
    alreadyOnPassportRoster = canOfferPassportStamp(dbPlan);
  } else {
    leaderNames = await leaderNamesPromise;
  }

  const uniqueStampedCount = Object.values(stampMap).filter((s) => s.count > 0).length;
  const rank = getPassportRank(uniqueStampedCount, restaurants.length);
  const progress = getPassportProgress(uniqueStampedCount, restaurants.length);

  const isAuthenticated = Boolean(session);
  const client = (
    <PasaporteClient
      userName={session?.nombre || session?.email || "Visitante"}
      userImage={userImage}
      userId={userId}
      isAuthenticated={isAuthenticated}
      alreadyOnPassportRoster={alreadyOnPassportRoster}
      isFirstLoginUser={isFirstLoginUser}
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
      leaderNames={leaderNames}
      pendingConfirm={pendingConfirm}
      pendingInvalid={Boolean(session && pendiente && !pendingConfirm)}
    />
  );

  if (isAuthenticated) {
    return (
      <PasaporteImmersiveShell>
        <Navbar />
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden lg:overflow-visible lg:h-auto">
          {client}
        </main>
        <div className="hidden lg:block shrink-0">
          <Footer />
        </div>
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
