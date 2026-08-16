import { redirect } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import PasesMarketplace from "../barrid/PasesMarketplace";
import { getSession } from "@/lib/auth-utils";
import { listPublishedAccessEvents } from "@/lib/access-marketplace";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pases | Barriando",
  description: "Boletos y entradas a eventos del Centro Histórico de Puebla.",
};

export default async function PasesPage({
  searchParams,
}: {
  searchParams: Promise<{ pase?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();

  // Con sesión, la lista vive en /barrid junto a la ficha BarrID (todos los planes).
  if (session) {
    const q = params.pase === "cancelado" ? "?pase=cancelado" : "";
    redirect(`/barrid${q}`);
  }

  const events = await listPublishedAccessEvents();

  return (
    <SiteShell>
      <Navbar />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-[max(2rem,calc(env(safe-area-inset-top,0px)+1rem))] pb-8 md:py-12">
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
