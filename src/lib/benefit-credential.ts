import { SignJWT, jwtVerify } from "jose";

const CREDENTIAL_TTL_SECONDS = 15 * 60;

function getSecretKey() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("Falta AUTH_SECRET para firmar credenciales de beneficio.");
  }
  return new TextEncoder().encode(secret);
}

export function getAppOrigin(): string {
  const raw =
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

export async function signBenefitCredentialToken(userId: string): Promise<string> {
  return new SignJWT({ typ: "benefit_credential" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${CREDENTIAL_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifyBenefitCredentialToken(
  token: string
): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.typ !== "benefit_credential") return null;
    const userId = typeof payload.sub === "string" ? payload.sub : null;
    if (!userId) return null;
    return { userId };
  } catch {
    return null;
  }
}

export function buildBenefitVerifyPath(token: string): string {
  return `/beneficios/verificar?token=${encodeURIComponent(token)}`;
}

export function buildBenefitVerifyUrl(token: string): string {
  return `${getAppOrigin()}${buildBenefitVerifyPath(token)}`;
}

export function isBenefitCurrentlyValid(input: {
  offersBenefit: boolean;
  benefitValidFrom?: Date | string | null;
  benefitValidUntil?: Date | string | null;
}): boolean {
  if (!input.offersBenefit) return false;
  const now = Date.now();
  if (input.benefitValidFrom) {
    const from = new Date(input.benefitValidFrom).getTime();
    if (Number.isFinite(from) && now < from) return false;
  }
  if (input.benefitValidUntil) {
    const until = new Date(input.benefitValidUntil).getTime();
    if (Number.isFinite(until) && now > until) return false;
  }
  return true;
}
