"use client";

import PlanIntentCta from "@/app/components/PlanIntentCta";

/** CTA de alta al MAP: si ya es Gran Empresa activa, mensaje (como en Pasaporte). */
export function MapBusinessSignupLink({
  className = "text-[10px] text-slate-400 hover:text-[#27366D] transition underline decoration-dotted underline-offset-2",
  messageClassName = "text-[10px] text-slate-500 cursor-default select-none",
}: {
  className?: string;
  messageClassName?: string;
}) {
  return (
    <PlanIntentCta
      plan="GRAN_EMPRESA"
      className={className}
      alreadyActiveMessage="Ya formas parte del MAPA con tu plan Gran Empresa."
      alreadyActiveClassName={messageClassName}
    >
      ¿Quieres estar en el MAPA? Regístrate aquí.
    </PlanIntentCta>
  );
}
