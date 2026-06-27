-- AlterTable
ALTER TABLE "SocioProfile" ADD COLUMN "linkageStatus" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "SocioProfile" ADD COLUMN "isManualEntry" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SocioProfile" ADD COLUMN "address" TEXT;
ALTER TABLE "SocioProfile" ADD COLUMN "category" TEXT;
