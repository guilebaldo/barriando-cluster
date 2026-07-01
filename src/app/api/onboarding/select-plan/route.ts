import { resolvePlanSelectionPath } from "@/lib/onboarding";
import { parsePlanSlug } from "@/lib/plan-routing";
import { secureError, secureJson } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const plan = parsePlanSlug(form.get("plan")?.toString());
    if (!plan) {
      return secureError("Plan no válido.", 400);
    }
    const path = await resolvePlanSelectionPath(plan);
    return secureJson({ path });
  } catch (error) {
    console.error("[onboarding] select-plan failed:", error);
    return secureError("No se pudo cambiar el plan.", 500);
  }
}
