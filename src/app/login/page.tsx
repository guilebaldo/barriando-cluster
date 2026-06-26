import { parsePlanSlug } from "@/lib/plan-routing";
import LoginClient from "./LoginClient";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const params = await searchParams;
  const plan = parsePlanSlug(params.plan) ?? "VECINO";
  return <LoginClient plan={plan} />;
}
