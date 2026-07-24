"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { hasCommercialAccess } from "@/lib/membresia";

const MAP_SIGNUP_HREF = "/planes?tipo=comerciales#gran_empresa";

/** CTA de alta al MAP: si ya es Gran Empresa activa, mensaje (como en Pasaporte). */
export function MapBusinessSignupLink({
  className = "text-[10px] text-slate-400 hover:text-[#27366D] transition underline decoration-dotted underline-offset-2",
  messageClassName = "text-[10px] text-slate-500 cursor-default select-none",
}: {
  className?: string;
  messageClassName?: string;
}) {
  const { data: session, status } = useSession();

  if (status === "authenticated") {
    const plan = session.user?.plan;
    const subscriptionStatus = session.user?.subscriptionStatus ?? "inactive";
    if (plan === "GRAN_EMPRESA" && hasCommercialAccess(plan, subscriptionStatus)) {
      return (
        <span
          className={messageClassName}
          title="Tu plan Gran Empresa ya incluye presencia en el MAP"
        >
          Ya formas parte del MAP con tu plan Gran Empresa.
        </span>
      );
    }
  }

  return (
    <Link href={MAP_SIGNUP_HREF} className={className}>
      ¿Quieres estar en el MAP? Regístrate aquí.
    </Link>
  );
}
