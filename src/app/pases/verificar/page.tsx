import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import SiteShell from "@/app/components/SiteShell";
import { getSession } from "@/lib/auth-utils";
import { buildLoginRedirectPath } from "@/lib/pasaporte";
import { loadAccessVerifyPayload } from "../actions";
import AccessVerifyClient from "./AccessVerifyClient";
import { formatAccessWhen } from "@/lib/access-events";

export const dynamic = "force-dynamic";

export default async function AccessVerifyPage({
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
          <ErrorCard message="Falta el token del pase en el enlace." />
        </main>
        <Footer />
      </SiteShell>
    );
  }

  if (!session) {
    const callback = `/pases/verificar?token=${encodeURIComponent(token)}`;
    return (
      <SiteShell>
        <Navbar />
        <main className="flex-1 max-w-lg mx-auto py-12 px-6 w-full">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h1 className="text-xl font-black font-serif-cluster uppercase tracking-wide text-slate-950">
              Validar pase
            </h1>
            <p className="text-sm text-slate-600">
              Inicia sesión como personal del Clúster para confirmar la entrada.
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

  const payload = await loadAccessVerifyPayload(token);

  return (
    <SiteShell>
      <Navbar />
      <main className="flex-1 max-w-lg mx-auto py-12 px-6 w-full">
        {payload.ok ? (
          payload.data.alreadyRedeemed ? (
            <ErrorCard
              message={`Este pase de ${payload.data.holderName} ya fue usado (${payload.data.eventTitle}).`}
            />
          ) : (
            <AccessVerifyClient
              token={token}
              holderName={payload.data.holderName}
              eventTitle={payload.data.eventTitle}
              whenLabel={formatAccessWhen(payload.data.startsAt, null)}
              venue={payload.data.venue}
            />
          )
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
      <Link href="/admin" className="text-xs font-bold text-[#27366D] hover:underline uppercase tracking-wider">
        Ir al admin
      </Link>
    </div>
  );
}
