-- Datos fiscales CFDI 4.0 en perfil de socio
ALTER TABLE "SocioProfile" ADD COLUMN IF NOT EXISTS "rfc" TEXT;
ALTER TABLE "SocioProfile" ADD COLUMN IF NOT EXISTS "razonSocial" TEXT;
ALTER TABLE "SocioProfile" ADD COLUMN IF NOT EXISTS "regimenFiscal" TEXT;
ALTER TABLE "SocioProfile" ADD COLUMN IF NOT EXISTS "usoCfdi" TEXT;
ALTER TABLE "SocioProfile" ADD COLUMN IF NOT EXISTS "billingStreet" TEXT;
ALTER TABLE "SocioProfile" ADD COLUMN IF NOT EXISTS "billingColonia" TEXT;
ALTER TABLE "SocioProfile" ADD COLUMN IF NOT EXISTS "billingCiudad" TEXT;
ALTER TABLE "SocioProfile" ADD COLUMN IF NOT EXISTS "billingEstado" TEXT;
ALTER TABLE "SocioProfile" ADD COLUMN IF NOT EXISTS "billingPais" TEXT;
ALTER TABLE "SocioProfile" ADD COLUMN IF NOT EXISTS "billingCodigoPostal" TEXT;
ALTER TABLE "SocioProfile" ADD COLUMN IF NOT EXISTS "billingAddressFull" TEXT;
