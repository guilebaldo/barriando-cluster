-- CreateTable
CREATE TABLE IF NOT EXISTS "CatalogMembership" (
    "socioId" INTEGER NOT NULL,
    "plan" "MembershipPlan" NOT NULL,
    "paymentMethod" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "businessName" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogMembership_pkey" PRIMARY KEY ("socioId")
);
