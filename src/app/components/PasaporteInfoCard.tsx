import PasaporteGoogleCta from "../pasaporte-info/PasaporteGoogleCta";
import { buildSellarPath } from "@/lib/pasaporte";

export default function PasaporteInfoCard({
  className = "",
  pendingStamp = null,
}: {
  className?: string;
  pendingStamp?: { slug: string; name: string } | null;
}) {
  const googleCallback = pendingStamp ? buildSellarPath(pendingStamp.slug) : "/pasaporte";

  return (
    <section
      className={`w-full bg-[#27366D] text-white rounded-2xl p-6 sm:p-8 md:p-10 border border-[#1e2b58] ${className}`}
    >
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">
          Pasaporte Digital
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-black font-serif-cluster uppercase tracking-wide">
          {pendingStamp ? "Sella tu visita" : "Abre tu Pasaporte"}
        </h1>
        <p className="mt-3 text-sm text-slate-200 font-light leading-relaxed max-w-xl mx-auto">
          {pendingStamp ? (
            <>
              Escaneaste el QR de{" "}
              <span className="font-semibold text-white">{pendingStamp.name}</span>. Entra a tu
              cuenta para guardar el sello y seguir coleccionando.
            </>
          ) : (
            <>
              Recorre el Centro Histórico, guarda cada visita y completa la temporada. Es gratis,
              rápido y tu progreso queda en la nube.
            </>
          )}
        </p>
      </div>

      <div className="mt-7 sm:mt-8 mx-auto max-w-sm">
        <p className="mb-4 text-center text-[11px] font-bold uppercase tracking-widest text-amber-400/90">
          Continúa para empezar
        </p>
        <PasaporteGoogleCta callbackUrl={googleCallback} />
      </div>
    </section>
  );
}
