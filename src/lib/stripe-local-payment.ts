export type StripeLocalPaymentMethod = "oxxo" | "spei";

export function isStripeLocalPaymentMethod(value: unknown): value is StripeLocalPaymentMethod {
  return value === "oxxo" || value === "spei";
}
