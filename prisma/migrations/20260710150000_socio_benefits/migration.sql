-- AlterTable
ALTER TABLE "SocioProfile" ADD COLUMN IF NOT EXISTS "offersBenefit" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SocioProfile" ADD COLUMN IF NOT EXISTS "benefitTitle" TEXT;
ALTER TABLE "SocioProfile" ADD COLUMN IF NOT EXISTS "benefitDescription" TEXT;
ALTER TABLE "SocioProfile" ADD COLUMN IF NOT EXISTS "benefitHowToRedeem" TEXT;
ALTER TABLE "SocioProfile" ADD COLUMN IF NOT EXISTS "benefitValidFrom" TIMESTAMP(3);
ALTER TABLE "SocioProfile" ADD COLUMN IF NOT EXISTS "benefitValidUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "BenefitRedemption" (
    "id" TEXT NOT NULL,
    "beneficiaryUserId" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "socioProfileId" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BenefitRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BenefitRedemption_beneficiaryUserId_idx" ON "BenefitRedemption"("beneficiaryUserId");
CREATE INDEX IF NOT EXISTS "BenefitRedemption_providerUserId_idx" ON "BenefitRedemption"("providerUserId");
CREATE INDEX IF NOT EXISTS "BenefitRedemption_socioProfileId_idx" ON "BenefitRedemption"("socioProfileId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "BenefitRedemption" ADD CONSTRAINT "BenefitRedemption_beneficiaryUserId_fkey" FOREIGN KEY ("beneficiaryUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "BenefitRedemption" ADD CONSTRAINT "BenefitRedemption_providerUserId_fkey" FOREIGN KEY ("providerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "BenefitRedemption" ADD CONSTRAINT "BenefitRedemption_socioProfileId_fkey" FOREIGN KEY ("socioProfileId") REFERENCES "SocioProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
