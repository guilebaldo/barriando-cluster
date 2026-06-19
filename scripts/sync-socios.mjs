import { readFileSync, writeFileSync } from "fs";

const csvPath = process.argv[2] || "/Users/gg27/Downloads/miembros_barriando - Hoja 1-2.csv";
const outPath = "src/app/data/socios.ts";

const raw = readFileSync(csvPath, "utf8");
const lines = raw.trim().split("\n").slice(1);

function toHttps(url) {
  if (url.startsWith("http://")) return "https://" + url.slice(7);
  return url;
}

const socios = lines.map((line, index) => {
  const parts = line.split(",");
  const foto = parts[0];
  const name = parts[1];
  const url = parts[2];
  const categoria = parts[3];
  const direccion = parts.slice(4).join(",").replace(/\r/g, "").trim();
  return {
    id: index + 1,
    name,
    categoria,
    foto,
    url: toHttps(url),
    direccion,
  };
});

const content = `export interface Socio {
  id: number;
  name: string;
  categoria: string;
  foto: string;
  url: string;
  direccion?: string;
  telefono?: string;
}

export const listaSocios: Socio[] = ${JSON.stringify(socios, null, 2)
  .replace(/"([^"]+)":/g, "$1:")
  .replace(/"/g, '"')
  .replace(/,\n/g, ",\n")
  .replace(/^\{/gm, "    {")
  .replace(/^\}/gm, "    }")
  .replace(/^\[/, "[\n")
  .replace(/\]$/, "\n  ];")};
`;

writeFileSync(outPath, content);
console.log(`Synced ${socios.length} socios to ${outPath}`);
