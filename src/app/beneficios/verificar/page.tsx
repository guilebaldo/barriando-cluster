import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import SiteShell from "@/app/components/SiteShell";
import { getSession } from "@/lib/auth-utils";
import { buildLoginRedirectPath } from "@/lib/pasaporte";
import { loadBenefitVerifyPayload } from "../actions";
import BenefitVerifyClient from "./BenefitVerifyClient";

export const dynamic = "force-dynamic";

export default async function BenefitVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token?.trim() ?? "";
  const session = await getSession();

  if (!token) {
    return (
      <SiteShell>
        <Navbar />
        <main className="flex-1 max-w-lg mx-auto py-12 px-6 w-full">
          <ErrorCard message="Falta el token de la credencial en el enlace." />
        </main>
        <Footer />
      </SiteShell>
    );
  }

  if (!session) {
    const callback = `/beneficios/verificar?token=${encodeURIComponent(token)}`;
    return (
      <SiteShell>
        <Navbar />
        <main className="flex-1 max-w-lg mx-auto py-12 px-6 w-full">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h1 className="text-xl font-black font-serif-cluster uppercase tracking-wide text-slate-950">
              Validar beneficio
            </h1>
            <p className="text-sm text-slate-600">
              Inicia sesión como socio del negocio para verificar la credencial y confirmar el canje.
            </p>
            <Link
              href={buildLoginRedirectPath(callback)}
              className="inline-flex bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-lg transition"
            >
              Iniciar sesión
            </Link>
          </div>
        </main>
        <Footer />
      </SiteShell>
    );
  }

  const payload = await loadBenefitVerifyPayload(token);

  return (
    <SiteShell>
      <Navbar />
      <main className="flex-1 max-w-lg mx-auto py-12 px-6 w-full">
        {payload.ok ? (
          <BenefitVerifyClient token={token} beneficiary={payload.data.beneficiary} />
        ) : (
          <ErrorCard message={payload.error} />
        )}
      </main>
      <Footer />
    </SiteShell>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="bg-white border border-red-200 rounded-xl p-6 shadow-sm space-y-3">
      <h1 className="text-xl font-black font-serif-cluster uppercase tracking-wide text-slate-950">
        No se pudo validar
      </h1>
      <p className="text-sm text-red-800">{message}</p>
      <Link href="/panel" className="text-xs font-bold text-[#27366D] hover:underline uppercase tracking-wider">
        Ir al panel
      </Link>
    </div>
  );
}
