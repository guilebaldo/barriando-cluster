import { redirect } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PanelDashboard from "./PanelDashboard";
import { getSession, getUserWithSubscription } from "@/lib/auth-utils";
import { isStripeConfigured } from "@/lib/stripe";
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

  const params = await searchParams;
  const isNewUser = Date.now() - user.createdAt.getTime() < 5 * 60 * 1000;
  const showWelcome =
    params.bienvenida === "1" || (isNewUser && user.subscription?.plan === "VECINO");

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
          subscription={
            user.subscription
              ? {
                  plan: user.subscription.plan,
                  status: user.subscription.status,
                  currentPeriodEnd: user.subscription.currentPeriodEnd?.toISOString() ?? null,
                }
              : { plan: "VECINO" as const, status: "inactive", currentPeriodEnd: null }
          }
          stripeConfigured={isStripeConfigured()}
          showWelcome={showWelcome}
          socios={listaSocios.map((s) => ({ id: s.id, name: s.name, categoria: s.categoria }))}
        />
      </main>
      <Footer />
    </div>
  );
}
