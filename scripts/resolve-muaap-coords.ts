/**
 * Resuelve coordenadas reales (pin del lugar) desde los links maps.app.goo.gl del CSV MUAAP.
 * Uso: npx tsx scripts/resolve-muaap-coords.ts
 */
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { extractLatLngFromMapsEmbed, resolveMapsPlaceCoords } from "../src/lib/muaap-coords";

const CSV_PATH = path.join(process.cwd(), "data/barriando-muaap-hitos.csv");
const OUT_PATH = path.join(process.cwd(), "data/muaap-resolved-coords.json");

function parseCsvRows(raw: string) {
  const lines = raw.trim().split("\n").slice(1);
  const rows: Array<{ name: string; mapsUrl: string; html: string }> = [];
  for (const line of lines) {
    const firstComma = line.indexOf(",");
    const secondComma = line.indexOf(",", firstComma + 1);
    if (firstComma < 0 || secondComma < 0) continue;
    const name = line.slice(0, firstComma).trim();
    const mapsUrl = line.slice(firstComma + 1, secondComma).trim();
    let html = line.slice(secondComma + 1).trim();
    if (html.startsWith('"') && html.endsWith('"')) {
      html = html.slice(1, -1).replace(/""/g, '"');
    }
    rows.push({ name, mapsUrl, html });
  }
  return rows;
}

async function main() {
  const raw = readFileSync(CSV_PATH, "utf8");
  const rows = parseCsvRows(raw);
  const resolved: Record<string, { lat: number; lng: number; source: string }> = {};

  for (const row of rows) {
    const embedCoords = extractLatLngFromMapsEmbed(row.html);
    const placeCoords = await resolveMapsPlaceCoords(row.mapsUrl);
    const coords = placeCoords ?? embedCoords;

    if (!coords) {
      console.warn(`[skip] ${row.name}: sin coordenadas`);
      continue;
    }

    resolved[row.name] = {
      lat: coords.lat,
      lng: coords.lng,
      source: placeCoords ? "maps_url_pin" : "embed_fallback",
    };

    const changed =
      embedCoords &&
      placeCoords &&
      (Math.abs(embedCoords.lat - placeCoords.lat) > 0.0001 ||
        Math.abs(embedCoords.lng - placeCoords.lng) > 0.0001);

    console.log(
      `${row.name}: ${coords.lat}, ${coords.lng}${changed ? " (corregido vs embed)" : ""}`
    );

    await new Promise((r) => setTimeout(r, 350));
  }

  writeFileSync(OUT_PATH, JSON.stringify(resolved, null, 2));
  console.log(`\nGuardado: ${OUT_PATH} (${Object.keys(resolved).length} hitos)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
