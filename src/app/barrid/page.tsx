import { redirect } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BarrIdShell from "./BarrIdShell";
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

export const metadata = {
  title: "BarrID | Barriando",
  description: "Credencial digital de membresía Barriando.",
};

export default async function BarrIdPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?callbackUrl=/barrid");
  }

  const isAdmin = isAdminUser({ email: session.email, role: session.role });
  if (!isPaidMember(session.plan, session.subscriptionStatus) && !isAdmin) {
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
    <BarrIdShell>
      <Navbar />
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden md:overflow-visible">
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
        />
      </main>
      <div className="hidden md:block shrink-0">
        <Footer />
      </div>
    </BarrIdShell>
  );
}
