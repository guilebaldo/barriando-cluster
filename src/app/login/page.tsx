import { parsePlanSlug } from "@/lib/plan-routing";
import { setPendingPlanCookie } from "@/lib/onboarding";
import LoginClient from "./LoginClient";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const params = await searchParams;
  const plan = parsePlanSlug(params.plan) ?? "VECINO";
  await setPendingPlanCookie(plan);
  return <LoginClient plan={plan} />;
}
