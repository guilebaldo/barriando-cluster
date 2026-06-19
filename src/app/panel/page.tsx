import { redirect } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PanelDashboard from "./PanelDashboard";
import { getSession, getUserWithSubscription } from "@/lib/auth";
import { isStripeConfigured } from "@/lib/stripe";

export default async function PanelPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await getUserWithSubscription(session.id);
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Navbar />
      <main className="max-w-5xl mx-auto py-12 px-6">
        <PanelDashboard
          user={{
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            socioId: user.socioId,
          }}
          subscription={
            user.subscription
              ? {
                  status: user.subscription.status,
                  currentPeriodEnd: user.subscription.currentPeriodEnd?.toISOString() ?? null,
                }
              : null
          }
          stripeConfigured={isStripeConfigured()}
        />
      </main>
      <Footer />
    </div>
  );
}
