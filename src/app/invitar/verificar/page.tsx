import Link from "next/link";
import { revalidatePath } from "next/cache";
import { consumeSocioInviteToken } from "@/lib/socio-invite";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import SiteShell from "@/app/components/SiteShell";

export const dynamic = "force-dynamic";

export default async function InvitarVerificarPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token?.trim()
    ? await consumeSocioInviteToken(token.trim())
    : { ok: false as const, error: "Falta el token de verificación." };

  if (result.ok) {
    revalidatePath("/socios");
    revalidatePath("/map");
    revalidatePath("/admin");
    revalidatePath("/barrid");
  }

  return (
    <SiteShell>
      <Navbar />
      <main className="flex-1 max-w-lg mx-auto py-16 px-6 w-full">
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm space-y-4 text-center">
          {result.ok ? (
            <>
              <h1 className="text-xl font-black font-serif-cluster uppercase tracking-wide text-[#27366D]">
                Correo verificado
              </h1>
              <p className="text-sm text-slate-600 font-light leading-relaxed">
                Tu cuenta <strong className="text-slate-900">{result.email}</strong> ya está activa.
                Entra con Google o Apple usando ese mismo correo para acceder a Barrid y tu panel.
              </p>
              <Link
                href="/login?callbackUrl=/barrid"
                className="inline-flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-lg"
              >
                Iniciar sesión
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-xl font-black font-serif-cluster uppercase tracking-wide text-slate-950">
                No se pudo verificar
              </h1>
              <p className="text-sm text-slate-600 font-light leading-relaxed">{result.error}</p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center bg-[#27366D] hover:bg-[#1e2b58] text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-lg"
              >
                Ir al login
              </Link>
            </>
          )}
        </div>
      </main>
      <Footer />
    </SiteShell>
  );
}
