-- CreateTable
CREATE TABLE IF NOT EXISTS "CatalogSocioOverride" (
    "socioId" INTEGER NOT NULL,
    "website" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogSocioOverride_pkey" PRIMARY KEY ("socioId")
);
