import { Buffer } from "node:buffer";

export type AppleWalletCertificates = {
  wwdr: string | Buffer;
  signerCert: string | Buffer;
  signerKey: string | Buffer;
  signerKeyPassphrase?: string;
};

function readCertMaterial(raw: string | undefined): Buffer | null {
  const value = raw?.trim();
  if (!value) return null;
  if (value.includes("BEGIN")) {
    return Buffer.from(value.replace(/\\n/g, "\n"), "utf8");
  }
  return Buffer.from(value, "base64");
}

/** Certificados Apple Wallet (Pass Type ID + firma). Sin esto iOS no instala el pase. */
export function isAppleWalletConfigured(): boolean {
  return getAppleWalletCertificates() != null;
}

export function getAppleWalletIds(): {
  passTypeIdentifier: string;
  teamIdentifier: string;
} {
  return {
    passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID?.trim() || "",
    teamIdentifier: process.env.APPLE_TEAM_ID?.trim() || "",
  };
}

export function getAppleWalletCertificates(): AppleWalletCertificates | null {
  const { passTypeIdentifier, teamIdentifier } = getAppleWalletIds();
  if (!passTypeIdentifier || !teamIdentifier) return null;

  const wwdr = readCertMaterial(process.env.APPLE_WWDR_CERT ?? process.env.APPLE_WWDR_CERT_PEM);
  const signerCert = readCertMaterial(
    process.env.APPLE_PASS_SIGNER_CERT ?? process.env.APPLE_PASS_SIGNER_CERT_PEM
  );
  const signerKey = readCertMaterial(
    process.env.APPLE_PASS_SIGNER_KEY ?? process.env.APPLE_PASS_SIGNER_KEY_PEM
  );
  if (!wwdr || !signerCert || !signerKey) return null;

  const passphrase = process.env.APPLE_PASS_SIGNER_KEY_PASSPHRASE?.trim();
  return {
    wwdr,
    signerCert,
    signerKey,
    ...(passphrase ? { signerKeyPassphrase: passphrase } : {}),
  };
}
