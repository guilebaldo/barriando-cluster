import { NextRequest } from "next/server";
import { continueOnboardingAfterAuth } from "@/lib/onboarding";
import { parsePlanSlug } from "@/lib/plan-routing";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const plan = parsePlanSlug(request.nextUrl.searchParams.get("plan"));
  await continueOnboardingAfterAuth(plan);
}
