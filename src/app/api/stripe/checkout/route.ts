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
  /** card = suscripción Stripe; oxxo = pago único de un mes */
  method: z.enum(["card", "oxxo"]).optional().default("card"),
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
        return secureError(
          `Stripe no está listo para ${plan}: revisa STRIPE_SECRET_KEY, la publishable key y STRIPE_PRICE_ID_${plan} (Live) en Vercel.`,
          503
        );
      }
      const result = await createStripeCheckoutUrl(session.id, plan);
      if (!result.ok) {
        return secureError(result.error, 500);
      }
      return secureJson({ url: result.url });
    }

    if (!isStripeConfigured()) {
      return secureError("Stripe no está configurado (keys en Vercel).", 503);
    }

    const result = await createStripeLocalPaymentCheckoutUrl(session.id, plan, "oxxo");
    if (!result.ok) {
      return secureError(result.error, 500);
    }

    return secureJson({ url: result.url });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return secureError("Debes iniciar sesión", 401);
    }
    if (error instanceof z.ZodError) {
      return secureError(error.issues[0]?.message ?? "Datos inválidos", 400);
    }
    console.error("Stripe checkout error:", error);
    return secureError("No se pudo iniciar el pago", 500);
  }
}
