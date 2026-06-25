import { redirect } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PanelDashboard from "./PanelDashboard";
import { getSession, getUserWithSubscription } from "@/lib/auth-utils";
import { isStripeConfigured } from "@/lib/stripe";
import { hasCommercialAccess, isVecinoPlan } from "@/lib/membresia";
import { listaSocios } from "../data/socios";

export default async function PanelPage({
  searchParams,
}: {
  searchParams: Promise<{ bienvenida?: string; pago?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await getUserWithSubscription(session.id);
  if (!user) redirect("/login");

  const sub = user.subscription ?? { plan: "VECINO" as const, status: "inactive", currentPeriodEnd: null };

  if (!isVecinoPlan(sub.plan) && !hasCommercialAccess(sub.plan, sub.status)) {
    redirect("/api/onboarding/continue");
  }

  const params = await searchParams;
  const isNewUser = Date.now() - user.createdAt.getTime() < 5 * 60 * 1000;
  const showWelcome =
    params.bienvenida === "1" || (isNewUser && isVecinoPlan(sub.plan));

  let paymentNotice: string | null = null;
  if (params.pago === "exitoso") {
    paymentNotice = "¡Pago confirmado! Ya puedes vincular tu negocio certificado y usar las herramientas comerciales.";
  } else if (params.pago === "cancelado") {
    paymentNotice = "Pago cancelado. Puedes intentar de nuevo cuando quieras.";
  } else if (params.pago === "stripe_no_configurado") {
    paymentNotice = "Stripe no está configurado aún. Contacta al equipo de Barriando.";
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Navbar />
      <main className="max-w-5xl mx-auto py-12 px-6">
        <PanelDashboard
          user={{
            id: user.id,
            nombre: user.nombre ?? "",
            email: user.email ?? "",
            socioId: user.socioId,
          }}
          subscription={{
            plan: sub.plan,
            status: sub.status,
            currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
          }}
          stripeConfigured={isStripeConfigured()}
          showWelcome={showWelcome}
          paymentNotice={paymentNotice}
          socios={listaSocios.map((s) => ({ id: s.id, name: s.name, categoria: s.categoria }))}
        />
      </main>
      <Footer />
    </div>
  );
}
