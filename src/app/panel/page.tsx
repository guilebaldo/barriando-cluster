import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import PanelDashboard from "./PanelDashboard";
import PanelFallback from "./PanelFallback";
import PanelAuthGate from "./PanelAuthGate";
import RefreshSessionAfterPayment from "../components/RefreshSessionAfterPayment";
import { getSession } from "@/lib/auth-utils";
import { isStripeConfigured } from "@/lib/stripe";
import { syncStripeSubscriptionForUser } from "@/lib/stripe-sync";
import { expireMembershipsAfterGraceIfNeeded } from "@/lib/subscription-lifecycle";
import {
  canAccessPanel,
  canRegisterBusinessProfile,
  hasCommercialAccess,
  isTuristaPlan,
  needsCertificationPayment,
} from "@/lib/membresia";
import { isAdminUser } from "@/lib/admin";
import {
  loadPanelUser,
  loadTakenSocioIds,
  normalizePanelSubscription,
  normalizeSocioProfile,
  cleanupOrphanSocioProfile,
} from "@/lib/panel-data";
import { listaSocios } from "../data/socios";
import { listaHitos } from "../data/hitos";
import { getBarriandoPaymentDetails } from "@/lib/payment";
import { loadUserStampSummaries } from "@/lib/pasaporte-stamps";

export const dynamic = "force-dynamic";

export default async function PanelPage({
  searchParams,
}: {
  searchParams: Promise<{ bienvenida?: string; pago?: string; credencial?: string; success?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  if (!session) {
    return (
      <SiteShell>
        <Navbar />
        <main className="flex-1 max-w-5xl mx-auto py-12 px-6 w-full">
          <PanelAuthGate />
        </main>
        <Footer />
      </SiteShell>
    );
  }

  try {
    await expireMembershipsAfterGraceIfNeeded();

    let panelUser = await loadPanelUser(session.id);
    if (!panelUser) redirect("/login");

    const peekSub = normalizePanelSubscription(panelUser.subscription);
    const shouldSyncStripe =
      params.pago === "exitoso" ||
      params.pago === "procesando" ||
      params.success === "true" ||
      // Upgrade Vecino → negocio: reconcile latest Checkout even without query params.
      (peekSub.plan === "VECINO" && Boolean(peekSub.stripeCustomerId));

    if (shouldSyncStripe) {
      try {
        await syncStripeSubscriptionForUser(session.id);
        panelUser = (await loadPanelUser(session.id)) ?? panelUser;
      } catch (error) {
        console.error("[panel] stripe sync failed:", error);
      }
    }

    await cleanupOrphanSocioProfile(session.id, panelUser.socioId ?? null);
    panelUser = (await loadPanelUser(session.id)) ?? panelUser;

    const refreshedSub = normalizePanelSubscription(panelUser?.subscription);

    if (!canAccessPanel(refreshedSub.plan, refreshedSub.status)) {
      if (needsCertificationPayment(refreshedSub.plan, refreshedSub.status)) {
        redirect("/certificacion/pago");
      }
      redirect("/planes?pago=requiere_plan");
    }

    // Plan comercial: pueden llenar la ficha aunque el pago aún esté pendiente.
    // Vecino / otros planes de pago sin acceso → siguen a certificación.
    if (
      needsCertificationPayment(refreshedSub.plan, refreshedSub.status) &&
      !canRegisterBusinessProfile(refreshedSub.plan, refreshedSub.status)
    ) {
      redirect("/certificacion/pago");
    }

    const takenSocioIds = await loadTakenSocioIds(session.id);

    const createdAtMs = panelUser.createdAt ? new Date(panelUser.createdAt).getTime() : NaN;
    const isNewUser = Number.isFinite(createdAtMs) && Date.now() - createdAtMs < 5 * 60 * 1000;
    const showWelcome =
      params.bienvenida === "1" || (isNewUser && isTuristaPlan(refreshedSub.plan));

    let paymentNotice: string | null = null;
    const hasPaidAccess = hasCommercialAccess(refreshedSub.plan, refreshedSub.status);
    const pagoParam = params.pago;

    if (
      pagoParam === "cancelado" &&
      !hasPaidAccess &&
      !refreshedSub.stripeSubscriptionId
    ) {
      paymentNotice = "Pago cancelado. Puedes intentar de nuevo cuando quieras desde tu panel.";
    } else if (pagoParam === "stripe_no_configurado") {
      paymentNotice = "Stripe no está configurado aún. Contacta al equipo de Barriando.";
    }

    const catalogSocio =
      panelUser.socioId != null ? listaSocios.find((s) => s.id === panelUser.socioId) ?? null : null;
    const profile = normalizeSocioProfile(
      "socioProfile" in panelUser ? (panelUser.socioProfile ?? null) : null
    );

    const sociosList = Array.isArray(listaSocios)
      ? listaSocios.map((s) => ({ id: s.id, name: s.name, categoria: s.categoria }))
      : [];

    const paymentDetails = getBarriandoPaymentDetails();

    let milestonesVisited = 0;
    if (isTuristaPlan(refreshedSub.plan)) {
      const summaries = await loadUserStampSummaries(session.id);
      milestonesVisited = summaries.length;
    }

    return (
      <SiteShell>
        <RefreshSessionAfterPayment />
        <Navbar />
        <main className="flex-1 max-w-5xl mx-auto py-12 px-6 w-full">
          <PanelDashboard
            user={{
              id: panelUser.id,
              nombre: panelUser.nombre?.trim() || session.nombre || "Turista",
              email: panelUser.email ?? session.email ?? "",
              image: panelUser.image ?? null,
              socioId: panelUser.socioId ?? null,
            }}
            isAdmin={isAdminUser({ email: panelUser.email ?? session.email, role: panelUser.role })}
            subscription={refreshedSub}
            socioProfile={profile}
            catalogSocio={
              catalogSocio
                ? {
                    name: catalogSocio.name ?? "",
                    categoria: catalogSocio.categoria ?? "",
                    foto: catalogSocio.foto ?? "",
                    url: catalogSocio.url ?? "",
                    direccion: catalogSocio.direccion,
                  }
                : null
            }
            stripeConfigured={isStripeConfigured()}
            showWelcome={showWelcome}
            hasPaidAccess={hasPaidAccess}
            paymentNotice={paymentNotice}
            socios={sociosList}
            takenSocioIds={takenSocioIds}
            paymentDetails={paymentDetails}
            totalMilestones={listaHitos.length}
            milestonesVisited={milestonesVisited}
            showCredential={params.credencial === "1"}
          />
        </main>
        <Footer />
      </SiteShell>
    );
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("[panel] render failed:", error);
    return (
      <SiteShell>
        <Navbar />
        <main className="flex-1 max-w-5xl mx-auto py-12 px-6 w-full">
          <PanelFallback nombre={session.nombre || session.email || "Turista"} />
        </main>
        <Footer />
      </SiteShell>
    );
  }
}
