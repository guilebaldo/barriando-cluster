-- Renombrar plan gratuito VECINO → TURISTA y añadir VECINO como plan de pago
ALTER TYPE "MembershipPlan" RENAME VALUE 'VECINO' TO 'TURISTA';
ALTER TYPE "MembershipPlan" ADD VALUE IF NOT EXISTS 'VECINO';

-- Renombrar tabla de hitos MUAAP → MAP
ALTER TABLE "MuaapMilestone" RENAME TO "MapMilestone";
