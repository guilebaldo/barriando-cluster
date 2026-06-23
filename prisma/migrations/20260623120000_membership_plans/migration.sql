-- CreateEnum
CREATE TYPE "MembershipPlan" AS ENUM ('VECINO', 'NEGOCIO_FAMILIAR', 'MEDIANA_EMPRESA', 'GRAN_EMPRESA');

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN "plan" "MembershipPlan" NOT NULL DEFAULT 'VECINO',
ADD COLUMN "manualPaymentNote" TEXT;

-- Set existing subscriptions to VECINO (already default)
UPDATE "Subscription" SET "plan" = 'VECINO' WHERE "plan" IS NULL;
