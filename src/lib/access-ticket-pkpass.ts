import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { formatAccessWhen } from "@/lib/access-events";
import type { AccessTicketSaveEvent } from "@/lib/access-ticket-save";

function u16(n: number): Uint8Array {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(n);
  return b;
}

function u32(n: number): Uint8Array {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n);
  return b;
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i]!;
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function concat(parts: Uint8Array[]): Buffer {
  return Buffer.concat(parts.map((p) => Buffer.from(p)));
}

function zipStore(files: { name: string; data: Uint8Array }[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file.name, "utf8");
    const data = Buffer.from(file.data);
    const crc = crc32(data);
    const local = concat([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      name,
      data,
    ]);
    const central = concat([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      name,
    ]);
    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }
  const centralDir = concat(centrals);
  const end = concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(centralDir.length),
    u32(offset),
    u16(0),
  ]);
  return concat([...locals, centralDir, end]);
}

function sha1Hex(data: Uint8Array): string {
  return createHash("sha1").update(data).digest("hex");
}

/**
 * .pkpass para Wallet / Passbook / WalletPasses.
 * Apple Wallet en iOS solo lo instala si hay certificado Pass Type ID;
 * Android (WalletPasses, Pass2U) suele abrir el archivo igual.
 */
export async function buildAccessTicketPkpass(input: {
  ticketId: string;
  code: string;
  barcodeMessage: string;
  event: AccessTicketSaveEvent;
}): Promise<Buffer> {
  const iconPath = path.join(process.cwd(), "public", "logobarriando.png");
  const icon = await readFile(iconPath);
  const pass = {
    formatVersion: 1,
    passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID || "pass.org.barriando.pase",
    serialNumber: input.ticketId,
    teamIdentifier: process.env.APPLE_TEAM_ID || "BARRIANDO",
    organizationName: "Barriando",
    description: input.event.title,
    logoText: "Barriando",
    foregroundColor: "rgb(255, 255, 255)",
    backgroundColor: "rgb(39, 54, 109)",
    labelColor: "rgb(251, 191, 36)",
    relevantDate: input.event.startsAt,
    eventTicket: {
      primaryFields: [{ key: "event", label: "PASE", value: input.event.title }],
      secondaryFields: [{ key: "venue", label: "SEDE", value: input.event.venue }],
      auxiliaryFields: [
        {
          key: "when",
          label: "CUANDO",
          value: formatAccessWhen(input.event.startsAt, input.event.endsAt),
        },
      ],
      backFields: [
        { key: "code", label: "Código", value: input.code },
        {
          key: "info",
          label: "Entrada",
          value: "Muestra el código QR en la puerta. Un solo uso, salvo BarrioPASS.",
        },
      ],
    },
    barcode: {
      format: "PKBarcodeFormatQR",
      message: input.barcodeMessage,
      messageEncoding: "iso-8859-1",
    },
    locations:
      input.event.latitude != null && input.event.longitude != null
        ? [
            {
              latitude: input.event.latitude,
              longitude: input.event.longitude,
              relevantText: input.event.venue,
            },
          ]
        : undefined,
  };
  const passJson = Buffer.from(`${JSON.stringify(pass, null, 2)}\n`, "utf8");
  const files: { name: string; data: Uint8Array }[] = [
    { name: "pass.json", data: passJson },
    { name: "icon.png", data: icon },
    { name: "icon@2x.png", data: icon },
    { name: "logo.png", data: icon },
  ];
  const manifestLines = files.map((file) => `"${file.name}":"${sha1Hex(file.data)}"`);
  const manifest = Buffer.from(`{${manifestLines.join(",")}}\n`, "utf8");
  files.push({ name: "manifest.json", data: manifest });
  return zipStore(files);
}
