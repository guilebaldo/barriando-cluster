import Stripe from "stripe";
import { getStripePriceId, isStripeConfigured, isStripeConfiguredForPlan } from "./stripe-plans";

export { getStripePriceId, isStripeConfigured, isStripeConfiguredForPlan };

let stripeClient: Stripe | null = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripeClient) stripeClient = new Stripe(key);
  return stripeClient;
}
