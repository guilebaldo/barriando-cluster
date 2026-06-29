import type { MembershipPlan } from "@/generated/prisma/client";

export const PLAN_ADMIN_LABELS: Record<MembershipPlan, string> = {
  TURISTA: "Gratuito/Turista",
  VECINO: "Vecino",
  NEGOCIO_FAMILIAR: "Micro",
  MEDIANA_EMPRESA: "Mediana",
  GRAN_EMPRESA: "Gran Empresa",
};

export const MEMBERSHIP_STATUS_OPTIONS = [
  { value: "inactive", label: "Inactiva" },
  { value: "active", label: "Activa (Stripe)" },
  { value: "manual_pending", label: "Pendiente de validación" },
  { value: "manual_active", label: "Activa (manual)" },
  { value: "manual_rejected", label: "Rechazada" },
] as const;
