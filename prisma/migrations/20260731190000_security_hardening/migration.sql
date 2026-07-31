-- AlterTable
ALTER TABLE "BenefitRedemption" ADD COLUMN "credentialJti" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "BenefitRedemption_credentialJti_key" ON "BenefitRedemption"("credentialJti");

-- CreateTable
CREATE TABLE "RateLimitBucket" (
    "id" TEXT NOT NULL,
    "bucketKey" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "hits" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RateLimitBucket_createdAt_idx" ON "RateLimitBucket"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimitBucket_bucketKey_windowStart_key" ON "RateLimitBucket"("bucketKey", "windowStart");
