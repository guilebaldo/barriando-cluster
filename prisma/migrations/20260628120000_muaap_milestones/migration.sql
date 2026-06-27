-- CreateTable
CREATE TABLE "Business" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "website" TEXT,
    "mapsUrl" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MuaapMilestone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "mapsUrl" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "zone" INTEGER,
    "businessId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MuaapMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MuaapMilestone_name_key" ON "MuaapMilestone"("name");

-- CreateIndex
CREATE INDEX "MuaapMilestone_active_idx" ON "MuaapMilestone"("active");

-- AddForeignKey
ALTER TABLE "MuaapMilestone" ADD CONSTRAINT "MuaapMilestone_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;
