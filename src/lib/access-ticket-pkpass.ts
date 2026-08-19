import { readFile } from "node:fs/promises";
import path from "node:path";
import { PKPass } from "passkit-generator";
import { formatAccessWhen } from "@/lib/access-events";
import {
  getAppleWalletCertificates,
  getAppleWalletIds,
  isAppleWalletConfigured,
} from "@/lib/apple-wallet-config";
import type { AccessTicketSaveEvent } from "@/lib/access-ticket-save";

export class AppleWalletNotConfiguredError extends Error {
  constructor() {
    super("WALLET_NOT_CONFIGURED");
    this.name = "AppleWalletNotConfiguredError";
  }
}

/** Pase firmado listo para Apple Wallet / Passbook (iOS). */
export async function buildSignedAccessTicketPkpass(input: {
  ticketId: string;
  code: string;
  barcodeMessage: string;
  event: AccessTicketSaveEvent;
}): Promise<Buffer> {
  const certificates = getAppleWalletCertificates();
  if (!certificates) throw new AppleWalletNotConfiguredError();

  const { passTypeIdentifier, teamIdentifier } = getAppleWalletIds();
  const iconPath = path.join(process.cwd(), "public", "logobarriando.png");
  const icon = await readFile(iconPath);

  const pass = new PKPass(
    {
      "icon.png": icon,
      "icon@2x.png": icon,
      "logo.png": icon,
    },
    certificates,
    {
      serialNumber: input.ticketId,
      passTypeIdentifier,
      teamIdentifier,
      organizationName: "Barriando",
      description: input.event.title,
      logoText: "Barriando",
      foregroundColor: "rgb(255, 255, 255)",
      backgroundColor: "rgb(39, 54, 109)",
      labelColor: "rgb(251, 191, 36)",
    }
  );

  pass.type = "eventTicket";
  pass.setRelevantDate(new Date(input.event.startsAt));
  pass.primaryFields.push({ key: "event", label: "PASE", value: input.event.title });
  pass.secondaryFields.push({ key: "venue", label: "SEDE", value: input.event.venue });
  pass.auxiliaryFields.push({
    key: "when",
    label: "CUANDO",
    value: formatAccessWhen(input.event.startsAt, input.event.endsAt),
  });
  pass.backFields.push({ key: "code", label: "Código", value: input.code });
  pass.backFields.push({
    key: "info",
    label: "Entrada",
    value: "Muestra el código QR en la puerta. Un solo uso, salvo BarrioPASS.",
  });

  if (input.event.latitude != null && input.event.longitude != null) {
    pass.setLocations({
      latitude: input.event.latitude,
      longitude: input.event.longitude,
      relevantText: input.event.venue,
    });
  }

  pass.setBarcodes({
    message: input.barcodeMessage,
    format: "PKBarcodeFormatQR",
    messageEncoding: "iso-8859-1",
  });

  return pass.getAsBuffer();
}

export { isAppleWalletConfigured };
