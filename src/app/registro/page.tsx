import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-utils";
import { parsePlanSlug, planToSlug } from "@/lib/plan-routing";
import RegistroClient from "./RegistroClient";

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const params = await searchParams;
  const plan = parsePlanSlug(params.plan) ?? "TURISTA";

  const session = await getSession();
  if (session) {
    redirect(`/api/onboarding/continue?plan=${planToSlug(plan)}`);
  }

  return <RegistroClient plan={plan} />;
}
