import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import BarrIdShell from "../barrid/BarrIdShell";
import BarrIdClient from "../barrid/BarrIdClient";
import PasesMarketplace from "../barrid/PasesMarketplace";
import RefreshSessionAfterPayment from "../components/RefreshSessionAfterPayment";
import { getSession } from "@/lib/auth-utils";
import { listPublishedAccessEvents } from "@/lib/access-marketplace";
import { loadUserStampSummaries } from "@/lib/pasaporte-stamps";
import { loadPanelUser, normalizePanelSubscription } from "@/lib/panel-data";
import { getParticipatingRestaurantsAsync, getPassportProgress } from "@/lib/pasaporte";
import { isPaidMember, getPlanLabel, getSubscriptionStatusLabel } from "@/lib/membresia";
import { isAdminUser } from "@/lib/admin";
import {
  formatRenewalDisplay,
  resolveMembershipExpiryLabel,
  safePlanPriceLabel,
} from "@/lib/panel-display";
import { isFirstLoginAccount } from "@/lib/add-to-home-screen";
import { syncStripeSubscriptionForUser } from "@/lib/stripe-sync";
import { fulfillAccessTicketByCheckoutSessionId } from "@/lib/fulfill-access-ticket";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pases | Barriando",
  description: "Boletos y entradas a eventos del Centro Histórico de Puebla.",
};

export default async function PasesPage({
  searchParams,
}: {
  searchParams: Promise<{ pase?: string; session_id?: string; ficha?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  const events = await listPublishedAccessEvents();

  if (params.pase === "ok" && params.session_id && session) {
    try {
      await fulfillAccessTicketByCheckoutSessionId(params.session_id);
    } catch (error) {
      console.error("[pases] ticket checkout sync failed:", error);
    }
    redirect("/pases/mios?pase=ok");
  }

  if (!session) {
    return (
      <SiteShell>
        <Navbar />
        <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-[max(2rem,calc(env(safe-area-inset-top,0px)+1rem))] pb-8 md:py-12">
          <PasesMarketplace
            events={events}
            notice={params.pase === "cancelado" ? "cancelado" : null}
            signedIn={false}
          />
        </main>
        <Footer />
      </SiteShell>
    );
  }

  const isAdmin = isAdminUser({ email: session.email, role: session.role });
  let user = await loadPanelUser(session.id);
  let subscription = normalizePanelSubscription(user?.subscription);

  if (
    !isPaidMember(subscription.plan, subscription.status) &&
    Boolean(subscription.hasStripeCustomer)
  ) {
    try {
      await syncStripeSubscriptionForUser(session.id);
      user = (await loadPanelUser(session.id)) ?? user;
      subscription = normalizePanelSubscription(user?.subscription);
    } catch (error) {
      console.error("[pases] stripe sync failed:", error);
    }
  }

  const canRedeemCoupons =
    isPaidMember(subscription.plan, subscription.status) || isAdmin;

  const summaries = await loadUserStampSummaries(session.id);
  const totalRestaurants = (await getParticipatingRestaurantsAsync()).length;
  const stampedCount = summaries.length;
  const progress = getPassportProgress(stampedCount, totalRestaurants);
  const expiryLabel = resolveMembershipExpiryLabel({
    status: subscription.status,
    currentPeriodEnd: subscription.currentPeriodEnd,
    subscriptionCreatedAt: subscription.createdAt,
    stripeSubscriptionId: subscription.hasStripeSubscription,
  });
  const renewalLabel = formatRenewalDisplay(
    subscription.status,
    subscription.hasStripeSubscription
  );

  return (
    <BarrIdShell>
      <RefreshSessionAfterPayment />
      <Navbar />
      <main className="flex-1 min-h-0 relative overflow-hidden md:overflow-visible md:h-auto">
        {/* Desktop: catálogo de eventos (BarrID vive en el nombre del navbar). */}
        <div className="hidden md:block max-w-3xl mx-auto w-full px-6 lg:px-8 py-10 lg:py-14">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h1 className="text-2xl font-black tracking-wide text-slate-950 font-sans">Pases</h1>
            <Link
              href="/pases/mios"
              className="text-[11px] font-bold uppercase tracking-wider text-[#27366D] hover:text-amber-600"
            >
              Mis pases
            </Link>
          </div>
          <PasesMarketplace
            events={events}
            notice={params.pase === "cancelado" ? "cancelado" : null}
            signedIn
          />
        </div>
        {/* Móvil: lista + ficha BarrID. */}
        <BarrIdClient
          variant="home"
          user={{
            id: session.id,
            nombre: user?.nombre?.trim() || session.nombre || "Socio",
            email: user?.email ?? session.email,
            image: user?.image ?? null,
          }}
          planLabel={getPlanLabel(subscription.plan)}
          statusLabel={getSubscriptionStatusLabel(subscription.status)}
          priceLabel={safePlanPriceLabel(subscription.plan)}
          expiryLabel={expiryLabel}
          renewalLabel={renewalLabel}
          stampedCount={stampedCount}
          totalRestaurants={totalRestaurants}
          progress={progress}
          canRedeemCoupons={canRedeemCoupons}
          isFirstLoginUser={isFirstLoginAccount(user?.createdAt)}
          initialSheetExpanded={params.ficha === "1"}
          events={events}
          paseNotice={params.pase === "cancelado" ? params.pase : null}
        />
      </main>
      <div className="hidden md:block shrink-0">
        <Footer />
      </div>
    </BarrIdShell>
  );
}
