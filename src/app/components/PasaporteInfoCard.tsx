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
      className={`w-full bg-[#27366D] text-white rounded-2xl px-5 py-4 sm:px-6 sm:py-5 border border-[#1e2b58] ${className}`}
    >
      <div className="text-center">
        <h1 className="text-xl sm:text-2xl font-black font-serif-cluster uppercase tracking-wide">
          {pendingStamp ? "Sella tu visita" : "Abre tu Pasaporte"}
        </h1>
        <p className="mt-1.5 text-sm text-slate-200 font-light leading-relaxed max-w-xl mx-auto">
          {pendingStamp ? (
            <>
              Escaneaste el QR de{" "}
              <span className="font-semibold text-white">{pendingStamp.name}</span>. Entra a tu
              cuenta para guardar el sello y seguir coleccionando.
            </>
          ) : (
            <>¡Escanea y sella!</>
          )}
        </p>
      </div>

      <div className="mt-4 mx-auto max-w-sm">
        <p className="mb-2.5 text-center text-[11px] font-bold uppercase tracking-widest text-amber-400/90">
          Continúa para empezar
        </p>
        <PasaporteGoogleCta callbackUrl={googleCallback} />
      </div>
    </section>
  );
}
