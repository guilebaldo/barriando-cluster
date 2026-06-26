import type { MembershipPlan } from "@/generated/prisma/client";
import { PENDING_PLAN_COOKIE, planToSlug } from "@/lib/plan-routing";

export const PENDING_PLAN_COOKIE_MAX_AGE = 60 * 60 * 2;

export function pendingPlanCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: PENDING_PLAN_COOKIE_MAX_AGE,
  };
}

export function pendingPlanCookieValue(plan: MembershipPlan): string {
  return planToSlug(plan);
}

export { PENDING_PLAN_COOKIE };
