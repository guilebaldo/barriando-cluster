"use client";

import { useSearchParams } from "next/navigation";

export function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email")?.trim() ?? "";

  return (
    <div className="space-y-3">
      <p className="text-xs font-light leading-relaxed text-slate-600">
        {email ? (
          <>
            Enviamos un enlace de verificación a{" "}
            <strong className="font-semibold text-slate-900">{email}</strong>. Ábrelo en este
            dispositivo para confirmar tu acceso.
          </>
        ) : (
          <>
            Enviamos un enlace de verificación a tu correo. Ábrelo en este dispositivo para
            confirmar tu acceso.
          </>
        )}
      </p>
      <p className="text-[11px] font-light leading-relaxed text-slate-500">
        Si no lo ves en unos minutos, revisa spam o promociones. El enlace caduca en 24 horas y
        solo se puede usar una vez.
      </p>
    </div>
  );
}
