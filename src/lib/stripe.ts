import Stripe from "stripe";
import { getStripePriceId, isStripeConfigured, isStripeConfiguredForPlan, formatStripeError } from "./stripe-plans";

export { getStripePriceId, isStripeConfigured, isStripeConfiguredForPlan, formatStripeError };

let stripeClient: Stripe | null = null;
let stripeClientKey: string | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (!stripeClient || stripeClientKey !== key) {
    stripeClient = new Stripe(key);
    stripeClientKey = key;
  }
  return stripeClient;
}
