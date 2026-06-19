#!/usr/bin/env node
/**
 * Geocodifica socios con Nominatim (OpenStreetMap).
 * Uso: node scripts/geocode-socios.mjs
 * Genera src/app/data/socios-coords.ts
 */
import { readFileSync, writeFileSync } from "fs";

const sociosPath = "src/app/data/socios.ts";
const outPath = "src/app/data/socios-coords.ts";

const raw = readFileSync(sociosPath, "utf8");
const matches = [...raw.matchAll(/id:\s*(\d+),\s*name:\s*"([^"]+)"/g)];
const socios = matches.map((m) => ({ id: Number(m[1]), name: m[2] }));

const coords = {};
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

for (const socio of socios) {
  const query = encodeURIComponent(`${socio.name}, Centro Histórico, Puebla, México`);
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      { headers: { "User-Agent": "BarriandoCluster/1.0 (clusterturistico.pue@gmail.com)" } }
    );
    const data = await res.json();
    if (data[0]) {
      coords[socio.id] = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        name: socio.name,
      };
      console.log(`✓ ${socio.name}: ${data[0].lat}, ${data[0].lon}`);
    } else {
      // Fallback: centro histórico Puebla con pequeño offset por id
      const baseLat = 19.0414;
      const baseLng = -98.2063;
      const offset = (socio.id % 10) * 0.002;
      coords[socio.id] = {
        lat: baseLat + offset * 0.3,
        lng: baseLng + offset * 0.5,
        name: socio.name,
        approx: true,
      };
      console.log(`~ ${socio.name}: aproximado`);
    }
  } catch (e) {
    console.error(`✗ ${socio.name}`, e.message);
  }
  await delay(1100);
}

const content = `// Auto-generado por scripts/geocode-socios.mjs
export interface SocioCoord {
  lat: number;
  lng: number;
  name: string;
  approx?: boolean;
}

export const sociosCoords: Record<number, SocioCoord> = ${JSON.stringify(coords, null, 2)};
`;

writeFileSync(outPath, content);
console.log(`\nGuardado en ${outPath} (${Object.keys(coords).length} puntos)`);
