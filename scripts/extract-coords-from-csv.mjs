import { readFileSync, writeFileSync } from "fs";

const csvPath =
  process.argv[2] || "/Users/gg27/Downloads/miembros_barriando - Hoja 1-3.csv";
const sociosPath = "src/app/data/socios.ts";
const outPath = "src/app/data/socios-coords.ts";

const sociosSrc = readFileSync(sociosPath, "utf8");
const fotoToMeta = [...sociosSrc.matchAll(/id:\s*(\d+)[\s\S]*?name:\s*"([^"]+)"[\s\S]*?foto:\s*"([^"]+)"/g)].map(
  (m) => ({ id: Number(m[1]), name: m[2], foto: m[3] })
);

const raw = readFileSync(csvPath, "utf8");
const lines = raw.trim().split("\n").slice(1);

function extractLatLng(html) {
  const m3d = html.match(/!3d(-?\d+\.?\d*)/);
  const m2d = html.match(/!2d(-?\d+\.?\d*)/);
  if (m3d && m2d) return { lat: Number(m3d[1]), lng: Number(m2d[1]) };
  return null;
}

const coords = {};
let matched = 0;

for (const line of lines) {
  const foto = line.split(",")[0]?.trim();
  if (!foto) continue;
  const meta = fotoToMeta.find((s) => s.foto === foto);
  if (!meta) {
    console.warn(`Sin socio en catálogo para foto: ${foto}`);
    continue;
  }
  const pos = extractLatLng(line);
  if (!pos) {
    console.warn(`Sin coordenadas en embed para: ${foto}`);
    continue;
  }
  coords[meta.id] = {
    lat: pos.lat,
    lng: pos.lng,
    name: meta.name,
  };
  matched++;
}

const content = `// Coordenadas extraídas de Google Maps embed (miembros_barriando CSV)
export interface SocioCoord {
  lat: number;
  lng: number;
  name: string;
}

export const sociosCoords: Record<number, SocioCoord> = ${JSON.stringify(coords, null, 2)};
`;

writeFileSync(outPath, content);
console.log(`Coordenadas guardadas: ${matched}/${fotoToMeta.length} en ${outPath}`);
