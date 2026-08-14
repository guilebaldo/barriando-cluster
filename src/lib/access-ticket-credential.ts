import { SignJWT, jwtVerify } from "jose";
import { getAppOrigin } from "@/lib/benefit-credential";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("Falta AUTH_SECRET para firmar pases.");
  }
  return new TextEncoder().encode(secret);
}

export async function signAccessTicketToken(input: {
  userId: string;
  ticketId: string;
  code: string;
  expiresInSeconds: number;
}): Promise<string> {
  return new SignJWT({ typ: "access_ticket", ticketId: input.ticketId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.userId)
    .setJti(input.code)
    .setIssuedAt()
    .setExpirationTime(`${Math.max(60, input.expiresInSeconds)}s`)
    .sign(getSecretKey());
}

export async function verifyAccessTicketToken(token: string): Promise<{
  userId: string;
  ticketId: string;
  code: string;
} | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.typ !== "access_ticket") return null;
    const userId = typeof payload.sub === "string" ? payload.sub : null;
    const ticketId = typeof payload.ticketId === "string" ? payload.ticketId : null;
    const code = typeof payload.jti === "string" ? payload.jti : null;
    if (!userId || !ticketId || !code) return null;
    return { userId, ticketId, code };
  } catch {
    return null;
  }
}

export function buildAccessVerifyPath(token: string): string {
  return `/pases/verificar?token=${encodeURIComponent(token)}`;
}

export function buildAccessVerifyUrl(token: string): string {
  return `${getAppOrigin()}${buildAccessVerifyPath(token)}`;
}

export function accessTicketTtlSeconds(endsAt: Date | null, startsAt: Date): number {
  const close = endsAt ?? new Date(startsAt.getTime() + 12 * 60 * 60 * 1000);
  const remaining = Math.ceil((close.getTime() + 24 * 60 * 60 * 1000 - Date.now()) / 1000);
  return Math.max(15 * 60, remaining);
}
