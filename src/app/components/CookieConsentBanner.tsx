"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readCookieConsent, writeCookieConsent } from "@/lib/cookie-consent";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!readCookieConsent());
  }, []);

  function accept() {
    writeCookieConsent();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      aria-live="polite"
      className="fixed inset-x-0 z-[75] px-3 pointer-events-none"
      style={{
        bottom: "max(0.75rem, calc(var(--app-hub-offset, 0px) + 0.75rem))",
      }}
    >
      <div className="pointer-events-auto mx-auto max-w-lg rounded-2xl border border-slate-200/90 bg-white/95 shadow-[0_12px_40px_rgba(15,23,42,0.16)] backdrop-blur-md px-4 py-3.5 sm:px-5 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#27366D]">
              Cookies
            </p>
            <p className="text-[12px] sm:text-[13px] text-slate-600 leading-relaxed">
              Usamos cookies esenciales para iniciar sesión y recordar el plan que elegiste.
              No usamos cookies de publicidad. Más detalle en el{" "}
              <Link
                href="/privacidad"
                className="font-semibold text-[#27366D] underline underline-offset-2 hover:text-[#1e2b58]"
              >
                aviso de privacidad
              </Link>
              .
            </p>
          </div>
          <button
            type="button"
            onClick={accept}
            className="shrink-0 inline-flex h-11 items-center justify-center rounded-xl bg-[#27366D] px-5 text-[11px] font-bold uppercase tracking-wider text-white transition hover:bg-[#1e2b58] active:scale-[0.98] sm:self-center"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
