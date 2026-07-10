import { redirect } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import BarrIdClient from "./BarrIdClient";
import { getSession } from "@/lib/auth-utils";
import { loadUserStampSummaries } from "@/lib/pasaporte-stamps";
import { loadPanelUser, normalizePanelSubscription } from "@/lib/panel-data";
import { getParticipatingRestaurants, getPassportProgress } from "@/lib/pasaporte";
import { isPaidMember, getPlanLabel, getSubscriptionStatusLabel } from "@/lib/membresia";
import { isAdminUser } from "@/lib/admin";
import {
  formatRenewalDisplay,
  resolveMembershipExpiryLabel,
  safePlanPriceLabel,
} from "@/lib/panel-display";

export const dynamic = "force-dynamic";

export default async function BarrIdPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?callbackUrl=/barrid");
  }

  if (!isPaidMember(session.plan, session.subscriptionStatus)) {
    redirect("/pasaporte");
  }

  const user = await loadPanelUser(session.id);
  const subscription = normalizePanelSubscription(user?.subscription);
  const summaries = await loadUserStampSummaries(session.id);
  const totalRestaurants = getParticipatingRestaurants().length;
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
    <SiteShell>
      <Navbar />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        <BarrIdClient
          user={{
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
          isAdmin={isAdminUser({ email: session.email, role: session.role })}
        />
      </main>
      <Footer />
    </SiteShell>
  );
}
