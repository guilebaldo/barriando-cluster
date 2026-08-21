-- Domicilio comercial en ops (sin exigir cuenta vinculada / SocioProfile).
ALTER TABLE "CatalogSocioOverride" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "CatalogSocioOverride" ADD COLUMN IF NOT EXISTS "street" TEXT;
ALTER TABLE "CatalogSocioOverride" ADD COLUMN IF NOT EXISTS "streetNumber" TEXT;
ALTER TABLE "CatalogSocioOverride" ADD COLUMN IF NOT EXISTS "colonia" TEXT;
ALTER TABLE "CatalogSocioOverride" ADD COLUMN IF NOT EXISTS "codigoPostal" TEXT;
ALTER TABLE "CatalogSocioOverride" ADD COLUMN IF NOT EXISTS "municipio" TEXT;
ALTER TABLE "CatalogSocioOverride" ADD COLUMN IF NOT EXISTS "estado" TEXT;
ALTER TABLE "CatalogSocioOverride" ADD COLUMN IF NOT EXISTS "pais" TEXT;
