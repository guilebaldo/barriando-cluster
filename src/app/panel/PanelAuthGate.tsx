"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

/** Espera sesión cliente tras bfcache (botón Atrás) antes de mandar a /login. */
export default function PanelAuthGate() {
  const { status, update } = useSession();
  const router = useRouter();

  useEffect(() => {
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        void update().then(() => router.refresh());
      }
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [update, router]);

  useEffect(() => {
    if (status === "authenticated") {
      router.refresh();
      return;
    }
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=%2Fpanel");
    }
  }, [status, router]);

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div
        className="h-8 w-8 border-2 border-[#27366D]/30 border-t-[#27366D] rounded-full animate-spin"
        aria-hidden
      />
      <p className="text-xs text-slate-500">Cargando tu panel…</p>
    </div>
  );
}
