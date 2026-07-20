import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { resolvePlanSelectionPath } from "@/lib/onboarding";
import { parsePlanSlug, registroUrl } from "@/lib/plan-routing";
import {
  PENDING_PLAN_COOKIE,
  pendingPlanCookieOptions,
  pendingPlanCookieValue,
} from "@/lib/pending-plan-cookie";
import { secureError, secureJson } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const plan = parsePlanSlug(form.get("plan")?.toString());
    if (!plan) {
      return secureError("Plan no válido.", 400);
    }

    const session = await auth();
    if (!session?.user?.id) {
      const response = secureJson({ path: registroUrl(plan) });
      response.cookies.set(
        PENDING_PLAN_COOKIE,
        pendingPlanCookieValue(plan),
        pendingPlanCookieOptions()
      );
      return response;
    }

    const path = await resolvePlanSelectionPath(plan);
    const response = secureJson({ path });
    response.cookies.set(
      PENDING_PLAN_COOKIE,
      pendingPlanCookieValue(plan),
      pendingPlanCookieOptions()
    );
    return response;
  } catch (error) {
    console.error("[onboarding] select-plan failed:", error);
    return secureError("No se pudo cambiar el plan.", 500);
  }
}
