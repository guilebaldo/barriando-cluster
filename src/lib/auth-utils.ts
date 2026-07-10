// lib/auth-utils.ts
import { auth } from "@/auth";
import { loadPanelUser } from "@/lib/panel-data";
import type { MembershipPlan, UserRole } from "@/generated/prisma/client";

export interface SessionUser {
  id: string;
  email: string;
  nombre: string;
  role: UserRole;
  socioId: number | null;
  plan: MembershipPlan;
  subscriptionStatus: string;
}

export async function getSession(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    email: session.user.email ?? "",
    nombre: session.user.name ?? "",
    role: session.user.role as UserRole,
    socioId: session.user.socioId ?? null,
    plan: session.user.plan ?? "TURISTA",
    subscriptionStatus: session.user.subscriptionStatus ?? "inactive",
  };
}

export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export async function getUserWithSubscription(userId: string) {
  return loadPanelUser(userId);
}
