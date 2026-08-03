import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import SiteShell from "@/app/components/SiteShell";
import { buildSellarPath } from "@/lib/pasaporte";

export const dynamic = "force-dynamic";

/**
 * Compatibilidad con QR viejos (`?restaurante=slug`).
 * Los nuevos usan `/pasaporte/sellar/[slug]` (más resistente a scrapes/recargas).
 */
export default async function SellarLegacyQueryPage({
  searchParams,
}: {
  searchParams: Promise<{ restaurante?: string }>;
}) {
  const params = await searchParams;
  const restaurante = params.restaurante?.trim();

  if (restaurante) {
    redirect(buildSellarPath(restaurante));
  }

  return (
    <SiteShell>
      <Navbar />
      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-16">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 text-center">
          <h1 className="text-xl font-black font-serif-cluster uppercase tracking-wide text-slate-950">
            QR incompleto
          </h1>
          <p className="text-sm text-slate-600 font-light leading-relaxed">
            Este enlace no trae el negocio. Vuelve a escanear el QR de la mesa o pídele al local
            uno actualizado.
          </p>
          <Link
            href="/pasaporte"
            className="inline-flex bg-[#27366D] hover:bg-[#1e2b58] text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-lg transition"
          >
            Ir al Pasaporte
          </Link>
        </div>
      </main>
      <div className="hidden md:block">
        <Footer />
      </div>
    </SiteShell>
  );
}
