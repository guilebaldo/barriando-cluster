import SociosPageClient from "./SociosPageClient";
import { getPublicSociosList } from "@/lib/public-socios";
import { getSession } from "@/lib/auth-utils";
import { isPaidMember } from "@/lib/membresia";

export const metadata = {
  title: "Socios | Barriando",
  description: "Mapa de negocios certificados del Centro Histórico de Puebla.",
};

export const dynamic = "force-dynamic";

export default async function SociosPage({
  searchParams,
}: {
  searchParams: Promise<{ beneficios?: string; socio?: string }>;
}) {
  const [socios, session, params] = await Promise.all([
    getPublicSociosList(),
    getSession(),
    searchParams,
  ]);
  const canRedeemBenefits = Boolean(
    session?.plan && isPaidMember(session.plan, session.subscriptionStatus ?? "inactive")
  );
  const initialBenefitsOnly = params.beneficios === "1";
  const socioParam = Number(params.socio);
  const initialSocioId =
    Number.isFinite(socioParam) && socios.some((s) => s.id === socioParam) ? socioParam : null;

  return (
    <SociosPageClient
      socios={socios}
      canRedeemBenefits={canRedeemBenefits}
      initialBenefitsOnly={initialBenefitsOnly}
      initialSocioId={initialSocioId}
    />
  );
}
