import { selectMembershipPlanForUser } from "@/lib/onboarding";
import { parsePlanSlug } from "@/lib/plan-routing";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const form = await request.formData();
  const plan = parsePlanSlug(form.get("plan")?.toString());
  if (!plan) {
    return Response.redirect(new URL("/planes", request.url), 303);
  }
  await selectMembershipPlanForUser(plan);
}
