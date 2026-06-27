import { redirect } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import PanelDashboard from "./PanelDashboard";
import PanelFallback from "./PanelFallback";
import { getSession } from "@/lib/auth-utils";
import { isStripeConfigured } from "@/lib/stripe";
import { syncStripeSubscriptionForUser } from "@/lib/stripe-sync";
import { expireManualSubscriptionsIfNeeded } from "@/lib/subscription-lifecycle";
import { canAccessPanel, hasCommercialAccess, isVecinoPlan } from "@/lib/membresia";
import { isAdminEmail } from "@/lib/admin";
import {
  loadPanelUser,
  loadTakenSocioIds,
  normalizePanelSubscription,
  normalizeSocioProfile,
} from "@/lib/panel-data";
import { listaSocios } from "../data/socios";
import { getBarriandoPaymentDetails } from "@/lib/payment";

export default async function PanelPage({
  searchParams,
}: {
  searchParams: Promise<{ bienvenida?: string; pago?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login");

  try {
    await expireManualSubscriptionsIfNeeded();

    if (params.pago === "exitoso" || params.pago === "procesando") {
      try {
        await syncStripeSubscriptionForUser(session.id);
      } catch (error) {
        console.error("[panel] stripe sync failed:", error);
      }
    }

    const user = await loadPanelUser(session.id);
    if (!user) redirect("/login");

    const refreshedSub = normalizePanelSubscription(user.subscription);

    const panelAllowed = canAccessPanel(refreshedSub.plan, refreshedSub.status, {
      stripeSubscriptionId: refreshedSub.stripeSubscriptionId,
      stripeCustomerId: refreshedSub.stripeCustomerId,
    });

    if (!panelAllowed) {
      redirect("/planes?pago=requiere_plan");
    }

    const takenSocioIds = await loadTakenSocioIds(session.id);

    const createdAtMs = user.createdAt ? new Date(user.createdAt).getTime() : NaN;
    const isNewUser = Number.isFinite(createdAtMs) && Date.now() - createdAtMs < 5 * 60 * 1000;
    const showWelcome =
      params.bienvenida === "1" || (isNewUser && isVecinoPlan(refreshedSub.plan));

    let paymentNotice: string | null = null;
    const hasPaidAccess = hasCommercialAccess(refreshedSub.plan, refreshedSub.status);
    const pagoParam = params.pago;

    if (pagoParam === "exitoso" || pagoParam === "procesando") {
      paymentNotice = hasPaidAccess
        ? "¡Pago confirmado! Ya puedes vincular tu negocio certificado y usar las herramientas comerciales."
        : "Recibimos tu pago. Estamos activando tu membresía; en unos segundos tendrás acceso completo. Si no cambia, recarga esta página.";
    } else if (
      pagoParam === "cancelado" &&
      !hasPaidAccess &&
      !refreshedSub.stripeSubscriptionId
    ) {
      paymentNotice = "Pago cancelado. Puedes intentar de nuevo cuando quieras desde tu panel.";
    } else if (pagoParam === "stripe_no_configurado") {
      paymentNotice = "Stripe no está configurado aún. Contacta al equipo de Barriando.";
    }

    const catalogSocio =
      user.socioId != null ? listaSocios.find((s) => s.id === user.socioId) ?? null : null;
    const profile = normalizeSocioProfile(
      "socioProfile" in user ? (user.socioProfile ?? null) : null
    );

    const sociosList = Array.isArray(listaSocios)
      ? listaSocios.map((s) => ({ id: s.id, name: s.name, categoria: s.categoria }))
      : [];

    const paymentDetails = getBarriandoPaymentDetails();

    return (
      <SiteShell>
        <Navbar />
        <main className="flex-1 max-w-5xl mx-auto py-12 px-6 w-full">
          <PanelDashboard
            user={{
              id: user.id,
              nombre: user.nombre?.trim() || session.nombre || "Vecino",
              email: user.email ?? session.email ?? "",
              socioId: user.socioId ?? null,
            }}
            isAdmin={isAdminEmail(user.email ?? session.email)}
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
            paymentNotice={paymentNotice}
            socios={sociosList}
            takenSocioIds={takenSocioIds}
            paymentDetails={paymentDetails}
          />
        </main>
        <Footer />
      </SiteShell>
    );
  } catch (error) {
    console.error("[panel] render failed:", error);
    return (
      <SiteShell>
        <Navbar />
        <main className="flex-1 max-w-5xl mx-auto py-12 px-6 w-full">
          <PanelFallback nombre={session.nombre || session.email || "Vecino"} />
        </main>
        <Footer />
      </SiteShell>
    );
  }
}
