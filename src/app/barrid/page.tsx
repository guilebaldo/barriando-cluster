import { redirect } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BarrIdShell from "./BarrIdShell";
import BarrIdClient from "./BarrIdClient";
import RefreshSessionAfterPayment from "../components/RefreshSessionAfterPayment";
import { getSession } from "@/lib/auth-utils";
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

export const dynamic = "force-dynamic";

export const metadata = {
  title: "BarrID | Barriando",
  description: "Credencial digital de membresía Barriando.",
};

export default async function BarrIdPage({
  searchParams,
}: {
  searchParams: Promise<{ pago?: string; bienvenida?: string; success?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  if (!session) {
    redirect("/login?callbackUrl=/barrid");
  }

  const isAdmin = isAdminUser({ email: session.email, role: session.role });
  const paymentReturn =
    params.pago === "exitoso" ||
    params.pago === "procesando" ||
    params.success === "true";

  let user = await loadPanelUser(session.id);
  let subscription = normalizePanelSubscription(user?.subscription);

  // JWT can still say TURISTA right after Checkout — sync + gate on DB.
  const shouldSyncStripe =
    paymentReturn ||
    (!isPaidMember(subscription.plan, subscription.status) &&
      Boolean(subscription.stripeCustomerId));

  if (shouldSyncStripe) {
    try {
      await syncStripeSubscriptionForUser(session.id);
      user = (await loadPanelUser(session.id)) ?? user;
      subscription = normalizePanelSubscription(user?.subscription);
    } catch (error) {
      console.error("[barrid] stripe sync failed:", error);
    }
  }

  if (!isPaidMember(subscription.plan, subscription.status) && !isAdmin) {
    if (paymentReturn) {
      // Checkout success but membership not visible yet — avoid bouncing to /pasaporte.
      redirect("/panel?pago=procesando");
    }
    redirect("/pasaporte");
  }
  const summaries = await loadUserStampSummaries(session.id);
  const totalRestaurants = (await getParticipatingRestaurantsAsync()).length;
  const stampedCount = summaries.length;
  const progress = getPassportProgress(stampedCount, totalRestaurants);

  const expiryLabel = resolveMembershipExpiryLabel({
    status: subscription.status,
    currentPeriodEnd: subscription.currentPeriodEnd,
    subscriptionCreatedAt: subscription.createdAt,
    stripeSubscriptionId: subscription.stripeSubscriptionId,
  });
  const renewalLabel = formatRenewalDisplay(
    subscription.status,
    subscription.stripeSubscriptionId
  );

  return (
    <BarrIdShell>
      <RefreshSessionAfterPayment />
      <Navbar />
      <main className="flex-1 min-h-0 relative overflow-hidden md:overflow-visible md:h-auto">
        <BarrIdClient
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
          isFirstLoginUser={isFirstLoginAccount(user?.createdAt)}
        />
      </main>
      <div className="hidden md:block shrink-0">
        <Footer />
      </div>
    </BarrIdShell>
  );
}
