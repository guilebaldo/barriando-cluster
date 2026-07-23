import { NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth-utils";
import { createStripeCheckoutUrl } from "@/lib/stripe-checkout";
import { createStripeLocalPaymentCheckoutUrl } from "@/lib/stripe-onetime-checkout";
import { isStripeConfigured, isStripeConfiguredForPlan } from "@/lib/stripe";
import { secureError, secureJson } from "@/lib/api";

const bodySchema = z.object({
  plan: z
    .enum(["VECINO", "NEGOCIO_FAMILIAR", "MEDIANA_EMPRESA", "GRAN_EMPRESA"])
    .optional(),
  /** card = suscripción Stripe; oxxo/spei = pago único de un mes */
  method: z.enum(["card", "oxxo", "spei"]).optional().default("card"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const rawBody = await request.json().catch(() => ({}));
    const { plan, method } = bodySchema.parse(rawBody);

    if (!plan) {
      return secureError("Selecciona un plan de pago.", 400);
    }

    if (method === "card") {
      if (!isStripeConfiguredForPlan(plan)) {
        return secureError("Stripe no está configurado para este plan.", 503);
      }
      const url = await createStripeCheckoutUrl(session.id, plan);
      if (!url) {
        return secureError("No se pudo iniciar el pago", 500);
      }
      return secureJson({ url });
    }

    if (!isStripeConfigured()) {
      return secureError("Stripe no está configurado.", 503);
    }

    const url = await createStripeLocalPaymentCheckoutUrl(session.id, plan, method);
    if (!url) {
      return secureError(
        method === "oxxo"
          ? "No se pudo iniciar el pago con OXXO. Verifica que OXXO esté activo en Stripe."
          : "No se pudo iniciar la transferencia SPEI. Verifica que las transferencias MX estén activas en Stripe.",
        500
      );
    }

    return secureJson({ url });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return secureError("Debes iniciar sesión", 401);
    }
    console.error("Stripe checkout error:", error);
    return secureError("No se pudo iniciar el pago", 500);
  }
}
