-- AlterTable
ALTER TABLE "CatalogMembership" ADD COLUMN IF NOT EXISTS "offersBenefit" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CatalogMembership" ADD COLUMN IF NOT EXISTS "benefitTitle" TEXT;
ALTER TABLE "CatalogMembership" ADD COLUMN IF NOT EXISTS "benefitDescription" TEXT;
ALTER TABLE "CatalogMembership" ADD COLUMN IF NOT EXISTS "benefitHowToRedeem" TEXT;
ALTER TABLE "CatalogMembership" ADD COLUMN IF NOT EXISTS "benefitRedeemViaQr" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CatalogMembership" ADD COLUMN IF NOT EXISTS "benefitValidFrom" TIMESTAMP(3);
ALTER TABLE "CatalogMembership" ADD COLUMN IF NOT EXISTS "benefitValidUntil" TIMESTAMP(3);
