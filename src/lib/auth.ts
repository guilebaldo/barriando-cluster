import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import type { UserRole } from "@/generated/prisma/client";

const COOKIE_NAME = "barriando_session";

export interface SessionUser {
  id: string;
  email: string;
  nombre: string;
  role: UserRole;
  socioId: number | null;
}

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret === "change-me-in-production") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET must be set in production");
    }
  }
  return new TextEncoder().encode(secret || "dev-secret-not-for-production");
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    role: user.role,
    socioId: user.socioId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      id: payload.id as string,
      email: payload.email as string,
      nombre: payload.nombre as string,
      role: payload.role as UserRole,
      socioId: (payload.socioId as number | null) ?? null,
    };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export async function getUserWithSubscription(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });
}
