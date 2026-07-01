import { NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth-utils";
import { createStripeCheckoutUrl } from "@/lib/stripe-checkout";
import { isStripeConfiguredForPlan } from "@/lib/stripe";
import { secureError, secureJson } from "@/lib/api";

const bodySchema = z.object({
  plan: z
    .enum(["VECINO", "NEGOCIO_FAMILIAR", "MEDIANA_EMPRESA", "GRAN_EMPRESA"])
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const rawBody = await request.json().catch(() => ({}));
    const { plan } = bodySchema.parse(rawBody);

    if (!plan) {
      return secureError("Selecciona un plan de pago.", 400);
    }

    if (!isStripeConfiguredForPlan(plan)) {
      return secureError("Stripe no está configurado para este plan.", 503);
    }

    const url = await createStripeCheckoutUrl(session.id, plan);
    if (!url) {
      return secureError("No se pudo iniciar el pago", 500);
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
