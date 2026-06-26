import { redirect } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import PanelDashboard from "./PanelDashboard";
import { getSession, getUserWithSubscription } from "@/lib/auth-utils";
import { isStripeConfigured } from "@/lib/stripe";
import { syncStripeSubscriptionForUser } from "@/lib/stripe-sync";
import { expireManualSubscriptionsIfNeeded } from "@/lib/subscription-lifecycle";
import { canAccessPanel, hasCommercialAccess, isVecinoPlan } from "@/lib/membresia";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { listaSocios } from "../data/socios";

export default async function PanelPage({
  searchParams,
}: {
  searchParams: Promise<{ bienvenida?: string; pago?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  if (!session) redirect("/login");

  await expireManualSubscriptionsIfNeeded();

  if (params.pago === "exitoso" || params.pago === "procesando") {
    await syncStripeSubscriptionForUser(session.id);
  }

  let user = await getUserWithSubscription(session.id);
  if (!user) redirect("/login");

  const refreshedSub = user.subscription ?? {
    plan: "VECINO" as const,
    status: "inactive",
    currentPeriodEnd: null,
    stripeSubscriptionId: null,
    stripeCustomerId: null,
  };

  const panelAllowed = canAccessPanel(refreshedSub.plan, refreshedSub.status, {
    stripeSubscriptionId: refreshedSub.stripeSubscriptionId,
    stripeCustomerId: refreshedSub.stripeCustomerId,
  });

  if (!panelAllowed) {
    redirect("/planes?pago=requiere_plan");
  }

  const takenRows = await prisma.user.findMany({
    where: { socioId: { not: null }, NOT: { id: session.id } },
    select: { socioId: true },
  });
  const takenSocioIds = takenRows.map((r) => r.socioId!);

  const isNewUser = Date.now() - user.createdAt.getTime() < 5 * 60 * 1000;
  const showWelcome =
    params.bienvenida === "1" || (isNewUser && isVecinoPlan(refreshedSub.plan));

  let paymentNotice: string | null = null;
  if (params.pago === "exitoso" && hasCommercialAccess(refreshedSub.plan, refreshedSub.status)) {
    paymentNotice = "¡Pago confirmado! Ya puedes vincular tu negocio certificado y usar las herramientas comerciales.";
  } else if (params.pago === "exitoso" || params.pago === "procesando") {
    paymentNotice =
      "Recibimos tu pago. Estamos activando tu membresía; en unos segundos tendrás acceso completo. Si no cambia, recarga esta página.";
  } else if (params.pago === "cancelado") {
    paymentNotice = "Pago cancelado. Puedes intentar de nuevo cuando quieras desde tu panel.";
  } else if (params.pago === "stripe_no_configurado") {
    paymentNotice = "Stripe no está configurado aún. Contacta al equipo de Barriando.";
  }

  const catalogSocio = user.socioId ? listaSocios.find((s) => s.id === user.socioId) ?? null : null;
  const profile = user.socioProfile;

  return (
    <SiteShell>
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto py-12 px-6 w-full">
        <PanelDashboard
          user={{
            id: user.id,
            nombre: user.nombre ?? "",
            email: user.email ?? "",
            socioId: user.socioId,
          }}
          isAdmin={isAdminEmail(user.email)}
          subscription={{
            plan: refreshedSub.plan,
            status: refreshedSub.status,
            currentPeriodEnd: refreshedSub.currentPeriodEnd?.toISOString() ?? null,
            stripeSubscriptionId: refreshedSub.stripeSubscriptionId,
          }}
          socioProfile={
            profile
              ? {
                  businessName: profile.businessName ?? "",
                  website: profile.website ?? "",
                  googleBusinessUrl: profile.googleBusinessUrl ?? "",
                  logoUrl: profile.logoUrl ?? "",
                }
              : null
          }
          catalogSocio={
            catalogSocio
              ? {
                  name: catalogSocio.name,
                  categoria: catalogSocio.categoria,
                  foto: catalogSocio.foto,
                  url: catalogSocio.url,
                  direccion: catalogSocio.direccion,
                }
              : null
          }
          stripeConfigured={isStripeConfigured()}
          showWelcome={showWelcome}
          paymentNotice={paymentNotice}
          socios={listaSocios.map((s) => ({ id: s.id, name: s.name, categoria: s.categoria }))}
          takenSocioIds={takenSocioIds}
        />
      </main>
      <Footer />
    </SiteShell>
  );
}
