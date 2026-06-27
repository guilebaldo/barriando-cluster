import path from "path";
import { prisma } from "../src/lib/prisma";
import { listaSocios } from "../src/app/data/socios";
import { sociosCoords } from "../src/app/data/socios-coords";
import { parseMuaapCsvFile } from "../src/lib/muaapRoute";

const DEFAULT_CSV = path.join(process.cwd(), "data/barriando-muaap-hitos.csv");

async function seedBusinesses() {
  for (const socio of listaSocios) {
    const coord = sociosCoords[socio.id];
    await prisma.business.upsert({
      where: { id: socio.id },
      create: {
        id: socio.id,
        name: socio.name,
        category: socio.categoria,
        website: socio.url,
        mapsUrl: socio.direccion,
        latitude: coord?.lat ?? null,
        longitude: coord?.lng ?? null,
      },
      update: {
        name: socio.name,
        category: socio.categoria,
        website: socio.url,
        mapsUrl: socio.direccion,
        latitude: coord?.lat ?? null,
        longitude: coord?.lng ?? null,
      },
    });
  }
}

async function seedMilestones(csvPath: string) {
  const rows = parseMuaapCsvFile(csvPath);
  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    await prisma.muaapMilestone.upsert({
      where: { name: row.name },
      create: {
        name: row.name,
        latitude: row.latitude,
        longitude: row.longitude,
        mapsUrl: row.mapsUrl,
        zone: row.zone ?? null,
        businessId: row.businessId,
        active: true,
      },
      update: {
        latitude: row.latitude,
        longitude: row.longitude,
        mapsUrl: row.mapsUrl,
        zone: row.zone ?? null,
        businessId: row.businessId,
        active: true,
      },
    });
    inserted++;
  }

  const csvNames = new Set(rows.map((r) => r.name));
  const existing = await prisma.muaapMilestone.findMany({ select: { name: true } });
  for (const item of existing) {
    if (!csvNames.has(item.name)) skipped++;
  }

  return { inserted, skipped, total: rows.length };
}

async function main() {
  const csvPath = process.argv[2] || DEFAULT_CSV;
  console.log(`[muaap-seed] CSV: ${csvPath}`);

  await seedBusinesses();
  console.log(`[muaap-seed] Catálogo Business sincronizado (${listaSocios.length} registros).`);

  const result = await seedMilestones(csvPath);
  console.log(
    `[muaap-seed] Hitos MUAAP: ${result.total} procesados, ${result.inserted} upserted, ${result.skipped} legacy sin CSV.`
  );
}

main()
  .catch((error) => {
    console.error("[muaap-seed] failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
