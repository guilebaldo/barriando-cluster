import { Camera, QrCode, Sparkles, UserRound } from "lucide-react";
import PasaporteGoogleCta from "../pasaporte-info/PasaporteGoogleCta";
import { buildSellarPath } from "@/lib/pasaporte";

const STEPS = [
  {
    icon: Camera,
    title: "Abre tu cámara",
    body: "Con el celular, usa la cámara nativa o el escáner de QR.",
  },
  {
    icon: QrCode,
    title: "Escanea el QR",
    body: "En el negocio o hito del MAP: el enlace abre Barriando al instante.",
  },
  {
    icon: UserRound,
    title: "Entra a tu cuenta",
    body: "Crea tu Pasaporte gratis con Google o un enlace a tu correo.",
  },
  {
    icon: Sparkles,
    title: "Colecciona y hazte Poblano",
    body: "Junta sellos de temporada, completa el recorrido y desbloquea tu insignia.",
  },
] as const;

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
              <span className="font-semibold text-white">{pendingStamp.name}</span>. Sigue estos
              pasos para guardar el sello y empezar a coleccionar.
            </>
          ) : (
            <>
              Recorre el Centro Histórico, guarda cada visita y completa la temporada. Es gratis,
              rápido y tu progreso queda en la nube.
            </>
          )}
        </p>
      </div>

      <ol className="mt-8 grid gap-3 sm:grid-cols-2 max-w-2xl mx-auto">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <li
              key={step.title}
              className="flex gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-left"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-slate-950 text-xs font-black">
                {index + 1}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-amber-400 shrink-0" aria-hidden />
                  <p className="text-xs font-bold uppercase tracking-wide text-white">{step.title}</p>
                </div>
                <p className="mt-1 text-[12px] font-light leading-relaxed text-slate-300">{step.body}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-8 sm:mt-10 mx-auto max-w-sm">
        <p className="mb-4 text-center text-[11px] font-bold uppercase tracking-widest text-amber-400/90">
          Continúa para empezar
        </p>
        <PasaporteGoogleCta callbackUrl={googleCallback} />
      </div>
    </section>
  );
}
