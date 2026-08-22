import { redirect } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import SiteShell from "@/app/components/SiteShell";
import PasesViewNav from "@/app/pases/PasesViewNav";
import { getSession } from "@/lib/auth-utils";
import { listUserAccessTickets } from "@/lib/access-marketplace";
import { fulfillAccessTicketByCheckoutSessionId } from "@/lib/fulfill-access-ticket";
import MisPasesList from "../MisPasesList";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mis pases | Barriando",
  description: "Tus boletos y QR de entrada a eventos del Centro Histórico.",
};

export default async function MisPasesPage({
  searchParams,
}: {
  searchParams: Promise<{ pase?: string; session_id?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login?callbackUrl=/pases/mios");
  }

  const params = await searchParams;
  if (params.pase === "ok" && params.session_id) {
    try {
      await fulfillAccessTicketByCheckoutSessionId(params.session_id);
    } catch (error) {
      console.error("[pases/mios] ticket checkout sync failed:", error);
    }
  }

  const tickets = await listUserAccessTickets(session.id);

  return (
    <SiteShell>
      <Navbar />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-[max(2rem,calc(env(safe-area-inset-top,0px)+1rem))] pb-8 md:py-12">
        <PasesViewNav active="mios" showMisPases />
        <p className="mt-4 text-sm text-slate-500 font-light">
          Muestra el QR en la entrada. Los pases de evento son de un solo uso;
          BarrioPASS cubre varias atracciones.
        </p>
        {params.pase === "ok" ? (
          <p className="mt-4 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            Tu pase ya está listo.
          </p>
        ) : null}
        <div className="mt-6">
          <MisPasesList tickets={tickets} />
        </div>
      </main>
      <Footer />
    </SiteShell>
  );
}
