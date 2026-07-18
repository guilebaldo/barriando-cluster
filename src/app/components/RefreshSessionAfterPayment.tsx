"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const PAYMENT_QUERY_KEYS = ["pago", "success", "bienvenida"] as const;

function isPaymentReturn(params: URLSearchParams): boolean {
  const pago = params.get("pago");
  const success = params.get("success");
  return pago === "exitoso" || pago === "procesando" || success === "true";
}

/**
 * After Stripe Checkout, the JWT often still has the old plan until logout.
 * Force Auth.js `update()` + RSC refresh so Navbar / gates match the DB.
 */
export default function RefreshSessionAfterPayment() {
  const { update } = useSession();
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    const params = new URLSearchParams(window.location.search);
    if (!isPaymentReturn(params)) return;
    ran.current = true;

    let cancelled = false;

    async function refresh(stripQuery: boolean) {
      await update();
      if (cancelled) return;
      router.refresh();
      if (!stripQuery) return;

      for (const key of PAYMENT_QUERY_KEYS) params.delete(key);
      const qs = params.toString();
      window.history.replaceState(
        null,
        "",
        qs ? `${window.location.pathname}?${qs}` : window.location.pathname
      );
    }

    void (async () => {
      await refresh(false);
      // Webhook / sync can lag a beat behind success_url.
      await new Promise((r) => setTimeout(r, 1200));
      if (cancelled) return;
      await refresh(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [update, router]);

  return null;
}
