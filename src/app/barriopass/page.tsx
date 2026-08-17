import type { Metadata } from "next";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import SiteShell from "@/app/components/SiteShell";
import { getSession } from "@/lib/auth-utils";
import { parseBarrioPassSku } from "@/lib/barriopass";
import { ensureBarrioPassEvent } from "@/lib/ensure-barriopass-event";
import BarrioPassClient from "./BarrioPassClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "BarrioPASS | Museos de Puebla en un solo pase",
  description:
    "Visita Museo Amparo, el Barroco y tres atracciones más en el Centro Histórico de Puebla. Un solo pago, hasta 46% menos que taquilla. Válido 9 días.",
};

export default async function BarrioPassPage({
  searchParams,
}: {
  searchParams: Promise<{ sku?: string; pase?: string }>;
}) {
  const session = await getSession();
  const params = await searchParams;
  const sku = parseBarrioPassSku(params.sku);
  const notice = params.pase === "cancelado" ? "cancelado" : null;

  await Promise.all([ensureBarrioPassEvent("classic"), ensureBarrioPassEvent("c3")]);

  return (
    <SiteShell className="bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <BarrioPassClient
          signedIn={Boolean(session)}
          initialSku={sku}
          notice={notice}
        />
      </main>
      <Footer />
    </SiteShell>
  );
}
