import { continueOnboardingAfterAuth } from "@/lib/onboarding";

export const runtime = "nodejs";

export async function GET() {
  await continueOnboardingAfterAuth();
}
