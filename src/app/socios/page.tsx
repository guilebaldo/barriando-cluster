import SociosPageClient from "./SociosPageClient";
import { getPublicSociosList } from "@/lib/public-socios";
import { getSession } from "@/lib/auth-utils";
import { isPaidMember } from "@/lib/membresia";

export default async function SociosPage() {
  const [socios, session] = await Promise.all([getPublicSociosList(), getSession()]);
  const canViewBenefits = Boolean(
    session?.plan && isPaidMember(session.plan, session.subscriptionStatus ?? "inactive")
  );

  return <SociosPageClient socios={socios} canViewBenefits={canViewBenefits} />;
}
