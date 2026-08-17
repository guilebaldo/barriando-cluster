"use server";

import { requireSession } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limit";
import { createBarrioPassCheckoutUrl } from "@/lib/stripe-barriopass-checkout";
import {
  BARRIOPASS_MAX_TICKETS_PER_ORDER,
  clampQty,
  parseBarrioPassSku,
} from "@/lib/barriopass";

export async function startBarrioPassCheckout(input: {
  sku: string;
  adultQty: number;
  childQty: number;
}): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const session = await requireSession();
    const limited = await rateLimit({
      bucketKey: `barriopass-checkout:user:${session.id}`,
      limit: 8,
      windowSeconds: 60 * 10,
    });
    if (!limited.ok) {
      return { ok: false, error: "Demasiados intentos de compra. Espera un momento." };
    }

    const sku = parseBarrioPassSku(input.sku);
    const adultQty = clampQty(input.adultQty);
    const childQty = clampQty(input.childQty);
    if (adultQty + childQty < 1) {
      return { ok: false, error: "Elige al menos un boleto." };
    }
    if (adultQty + childQty > BARRIOPASS_MAX_TICKETS_PER_ORDER) {
      return {
        ok: false,
        error: `Máximo ${BARRIOPASS_MAX_TICKETS_PER_ORDER} boletos por compra.`,
      };
    }

    return createBarrioPassCheckoutUrl({
      userId: session.id,
      sku,
      adultQty,
      childQty,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Debes iniciar sesión." };
    }
    return { ok: false, error: "No se pudo iniciar el pago." };
  }
}
