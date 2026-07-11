-- AlterTable
ALTER TABLE "SocioProfile" ADD COLUMN IF NOT EXISTS "benefitRedeemViaQr" BOOLEAN NOT NULL DEFAULT false;
