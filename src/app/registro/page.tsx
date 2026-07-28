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
    // Ya logueado: no mutar el plan ni abrir paywall solo por visitar /registro?plan=
    // (p. ej. CTA “Ser Vecino” desde Cuponera). Catálogo de planes para decidir.
    if (plan === "TURISTA") {
      redirect("/mapa");
    }
    const tipo =
      plan === "VECINO" ? "personales" : "comerciales";
    redirect(`/planes?tipo=${tipo}&plan=${planToSlug(plan)}`);
  }

  return <RegistroClient plan={plan} />;
}
