import type { MembershipPlan } from "@/generated/prisma/client";

export const PLAN_ADMIN_LABELS: Record<MembershipPlan, string> = {
  TURISTA: "Turista",
  VECINO: "Vecino",
  NEGOCIO_FAMILIAR: "Pequeña Empresa",
  MEDIANA_EMPRESA: "Mediana Empresa",
  GRAN_EMPRESA: "Gran Empresa",
};

export const PAYMENT_METHOD_OPTIONS = [
  { value: "stripe", label: "Domiciliación (Stripe)" },
  {
    value: "transfer",
    label: "Transferencia electrónica (incl. depósito en ventanilla)",
  },
  { value: "cash", label: "Efectivo" },
  { value: "oxxo", label: "OXXO (próximamente)" },
] as const;

export type PaymentMethodValue = (typeof PAYMENT_METHOD_OPTIONS)[number]["value"];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodValue, string> = {
  stripe: "Domiciliación (Stripe)",
  transfer: "Transferencia electrónica (incl. depósito en ventanilla)",
  cash: "Efectivo",
  oxxo: "OXXO (próximamente)",
};

export function resolvePaymentMethodLabel(
  paymentMethod: string | null | undefined,
  stripeSubscriptionId?: string | null,
  status?: string | null
): string {
  if (paymentMethod && paymentMethod in PAYMENT_METHOD_LABELS) {
    return PAYMENT_METHOD_LABELS[paymentMethod as PaymentMethodValue];
  }
  if (stripeSubscriptionId) return PAYMENT_METHOD_LABELS.stripe;
  if (status === "manual_pending" || status === "manual_active" || status === "manual_rejected") {
    return PAYMENT_METHOD_LABELS.transfer;
  }
  return "—";
}

export const MEMBERSHIP_STATUS_OPTIONS = [
  { value: "inactive", label: "Inactiva" },
  { value: "active", label: "Activa (Stripe)" },
  { value: "manual_pending", label: "Pendiente de validación" },
  { value: "manual_active", label: "Activa (manual)" },
  { value: "manual_rejected", label: "Rechazada" },
] as const;
