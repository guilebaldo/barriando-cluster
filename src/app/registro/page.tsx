import { getSession } from "@/lib/auth-utils";
import { parsePlanSlug } from "@/lib/plan-routing";
import RegistroClient from "./RegistroClient";

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const params = await searchParams;
  const plan = parsePlanSlug(params.plan) ?? "TURISTA";
  const session = await getSession();

  // Turista logueado puede ver la ficha del plan (p. ej. Vecino) sin que eso
  // cambie su home ni mute la membresía hasta que pulse Continuar al pago.
  return <RegistroClient plan={plan} alreadyLoggedIn={Boolean(session)} />;
}
