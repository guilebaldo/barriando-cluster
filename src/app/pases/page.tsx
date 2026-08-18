import { redirect } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import BarrIdShell from "../barrid/BarrIdShell";
import PasesMarketplace from "../barrid/PasesMarketplace";
import PasesSignedInHome from "./PasesSignedInHome";
import RefreshSessionAfterPayment from "../components/RefreshSessionAfterPayment";
import { getSession } from "@/lib/auth-utils";
import { listPublishedAccessEvents } from "@/lib/access-marketplace";
import { isFirstLoginAccount } from "@/lib/add-to-home-screen";
import { loadPanelUser } from "@/lib/panel-data";
import { fulfillAccessTicketByCheckoutSessionId } from "@/lib/fulfill-access-ticket";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pases | Barriando",
  description: "Boletos y entradas a eventos del Centro Histórico de Puebla.",
};

export default async function PasesPage({
  searchParams,
}: {
  searchParams: Promise<{ pase?: string; session_id?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  const events = await listPublishedAccessEvents();

  if (params.pase === "ok" && params.session_id && session) {
    try {
      await fulfillAccessTicketByCheckoutSessionId(params.session_id);
    } catch (error) {
      console.error("[pases] ticket checkout sync failed:", error);
    }
    redirect("/pases/mios?pase=ok");
  }

  if (!session) {
    return (
      <SiteShell>
        <Navbar />
        <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-[max(2rem,calc(env(safe-area-inset-top,0px)+1rem))] pb-8 md:py-12">
          <h1 className="text-2xl font-black tracking-wide text-slate-950 font-sans mb-4">Pases</h1>
          <PasesMarketplace
            events={events}
            notice={params.pase === "cancelado" ? "cancelado" : null}
            signedIn={false}
          />
        </main>
        <Footer />
      </SiteShell>
    );
  }

  const panelUser = await loadPanelUser(session.id);

  return (
    <BarrIdShell>
      <RefreshSessionAfterPayment />
      <Navbar />
      <main className="flex-1 min-h-0 relative overflow-y-auto overflow-x-hidden overscroll-y-contain md:overflow-visible md:h-auto">
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 md:px-6 lg:px-8 py-6 md:py-10 lg:py-14">
          <PasesSignedInHome
            events={events}
            notice={params.pase === "cancelado" ? "cancelado" : null}
            userId={session.id}
            isFirstLoginUser={isFirstLoginAccount(panelUser?.createdAt)}
          />
        </div>
      </main>
      <div className="hidden md:block shrink-0">
        <Footer />
      </div>
    </BarrIdShell>
  );
}
