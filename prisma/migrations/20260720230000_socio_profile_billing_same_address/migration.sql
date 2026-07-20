-- AlterTable SocioProfile: same fiscal address as business
ALTER TABLE "SocioProfile" ADD COLUMN IF NOT EXISTS "billingSameAddress" BOOLEAN NOT NULL DEFAULT true;
