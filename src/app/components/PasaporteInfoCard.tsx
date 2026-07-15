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
      className={`w-full bg-[#27366D] text-white rounded-2xl p-6 sm:p-8 md:p-10 border border-[#1e2b58] text-center ${className}`}
    >
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-black font-serif-cluster uppercase tracking-wide">
        {pendingStamp ? "Sella tu visita" : "Abre tu Pasaporte"}
      </h1>
      <p className="mt-3 text-sm text-slate-200 font-light leading-relaxed max-w-xl mx-auto">
        {pendingStamp ? (
          <>
            Escaneaste el QR de{" "}
            <span className="font-semibold text-white">{pendingStamp.name}</span>. Continúa con
            Google para crear tu cuenta y registrar el sello en tu Pasaporte.
          </>
        ) : (
          <>
            Guarda tus sellos del MAP, sigue tu progreso en temporada y desbloquea recompensas del
            barrio. Continúa con Google para crear o activar tu cuenta en un solo paso.
          </>
        )}
      </p>
      <div className="mt-6 sm:mt-8 flex justify-center">
        <PasaporteGoogleCta callbackUrl={googleCallback} />
      </div>
    </section>
  );
}
