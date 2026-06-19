import { auth } from "@/auth";
import { prisma } from "./prisma";
import type { UserRole } from "@/generated/prisma/client";

export interface SessionUser {
  id: string;
  email: string;
  nombre: string;
  role: UserRole;
  socioId: number | null;
}

export async function getSession(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    email: session.user.email ?? "",
    nombre: session.user.name ?? "",
    role: session.user.role,
    socioId: session.user.socioId,
  };
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
