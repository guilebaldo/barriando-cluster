import SociosPageClient from "./SociosPageClient";
import { getPublicSociosList } from "@/lib/public-socios";
import { getSession } from "@/lib/auth-utils";
import { isPaidMember } from "@/lib/membresia";

export default async function SociosPage({
  searchParams,
}: {
  searchParams: Promise<{ beneficios?: string }>;
}) {
  const [socios, session, params] = await Promise.all([
    getPublicSociosList(),
    getSession(),
    searchParams,
  ]);
  const canViewBenefits = Boolean(
    session?.plan && isPaidMember(session.plan, session.subscriptionStatus ?? "inactive")
  );
  const initialBenefitsOnly = params.beneficios === "1";

  return (
    <SociosPageClient
      socios={socios}
      canViewBenefits={canViewBenefits}
      initialBenefitsOnly={initialBenefitsOnly}
    />
  );
}
