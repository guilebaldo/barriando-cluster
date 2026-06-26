import { parsePlanSlug } from "@/lib/plan-routing";
import RegistroClient from "./RegistroClient";

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const params = await searchParams;
  const plan = parsePlanSlug(params.plan) ?? "VECINO";
  return <RegistroClient plan={plan} />;
}
