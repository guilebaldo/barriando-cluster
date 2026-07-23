export type StripeLocalPaymentMethod = "oxxo";

export function isStripeLocalPaymentMethod(value: unknown): value is StripeLocalPaymentMethod {
  return value === "oxxo";
}
