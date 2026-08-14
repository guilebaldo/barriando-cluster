import Link from "next/link";
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
  const events = await listPublishedAccessEvents();

  return (
    <SiteShell>
      <Navbar />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {session ? (
          <div className="mb-4 flex justify-end">
            <Link
              href="/pases/mios"
              className="text-[11px] font-bold uppercase tracking-wider text-[#27366D] hover:text-amber-600"
            >
              Mis pases
            </Link>
          </div>
        ) : null}
        <PasesMarketplace
          events={events}
          notice={params.pase === "cancelado" ? "cancelado" : null}
          signedIn={Boolean(session)}
        />
      </main>
      <Footer />
    </SiteShell>
  );
}
