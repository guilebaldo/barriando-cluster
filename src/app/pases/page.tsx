import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import PasesMarketplace from "../barrid/PasesMarketplace";
import { getSession } from "@/lib/auth-utils";
import { listPublishedAccessEvents, listUserAccessTickets } from "@/lib/access-marketplace";
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

  if (params.pase === "ok" && params.session_id && session) {
    try {
      await fulfillAccessTicketByCheckoutSessionId(params.session_id);
    } catch (error) {
      console.error("[pases] ticket checkout sync failed:", error);
    }
  }

  const [events, tickets] = await Promise.all([
    listPublishedAccessEvents(),
    session ? listUserAccessTickets(session.id) : Promise.resolve([]),
  ]);

  return (
    <SiteShell>
      <Navbar />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <PasesMarketplace
          events={events}
          tickets={tickets}
          notice={params.pase === "ok" || params.pase === "cancelado" ? params.pase : null}
          signedIn={Boolean(session)}
        />
      </main>
      <Footer />
    </SiteShell>
  );
}
