-- Eventos online: sin mapa; link de conexión en la ficha.
ALTER TABLE "AccessEvent" ADD COLUMN IF NOT EXISTS "online" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AccessEvent" ADD COLUMN IF NOT EXISTS "meetingUrl" TEXT;
