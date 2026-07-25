import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-utils";
import { getLiveStats } from "@/lib/get-live-stats";
import { isBusinessPlan } from "@/lib/membresia";
import { ONBOARDING_CONTINUE_PATH } from "@/lib/plan-routing";
import LandingSociosView, { liveStatsToLandingProps } from "./LandingSociosView";

export const metadata = {
  title: "PIPOPE — Socio empresa | Barriando",
  description:
    "PIPOPE: plataforma inteligente poblana de operaciones y planificación estratégica para empresas turísticas del Centro Histórico. Entra a la red, cosecha network effects y opera con panel digital.",
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
