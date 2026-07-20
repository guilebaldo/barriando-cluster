-- AlterTable
ALTER TABLE "SocioProfile" ADD COLUMN IF NOT EXISTS "rosterExcluded" BOOLEAN NOT NULL DEFAULT false;
