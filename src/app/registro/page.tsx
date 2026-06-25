import { parsePlanSlug } from "@/lib/plan-routing";
import { setPendingPlanCookie } from "@/lib/onboarding";
import RegistroClient from "./RegistroClient";

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const params = await searchParams;
  const plan = parsePlanSlug(params.plan) ?? "VECINO";
  await setPendingPlanCookie(plan);
  return <RegistroClient plan={plan} />;
}
