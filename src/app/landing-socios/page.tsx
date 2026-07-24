import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-utils";
import { getLiveStats } from "@/lib/get-live-stats";
import { isBusinessPlan } from "@/lib/membresia";
import { ONBOARDING_CONTINUE_PATH } from "@/lib/plan-routing";
import LandingSociosView, { liveStatsToLandingProps } from "./LandingSociosView";

export const metadata = {
  title: "Sé socio empresa | Barriando",
  description:
    "Registra tu negocio en Barriando: panel con pagos OXXO, datos fiscales, QR de Pasaporte, cupones y ficha en el directorio del Centro Histórico de Puebla.",
};

/** Landing de conversión para membresías empresa (panel socio + CTA Google/correo). */
export default async function LandingSociosPage() {
  const session = await getSession();
  if (session) {
    const plan = session.plan;
    if (plan && isBusinessPlan(plan)) {
      redirect("/panel");
    }
    redirect(`${ONBOARDING_CONTINUE_PATH}?plan=negocio_familiar`);
  }

  const stats = await getLiveStats();

  return <LandingSociosView {...liveStatsToLandingProps(stats)} />;
}
