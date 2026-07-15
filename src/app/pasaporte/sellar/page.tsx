import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-utils";
import { buildPasaportePendingStampPath } from "@/lib/pasaporte";
import { createStampForUser } from "@/lib/pasaporte-stamps";

export default async function SellarPage({
  searchParams,
}: {
  searchParams: Promise<{ restaurante?: string }>;
}) {
  const params = await searchParams;
  const restaurante = params.restaurante?.trim();

  if (!restaurante) {
    redirect("/pasaporte?error=restaurante_requerido");
  }

  const session = await getSession();

  if (!session) {
    // Guest: show passport preview + Google CTA, then resume sellar after auth.
    redirect(buildPasaportePendingStampPath(restaurante));
  }

  const result = await createStampForUser(session.id, restaurante);

  if (!result.ok) {
    redirect(`/pasaporte?error=${result.error}`);
  }

  if (result.cooldown) {
    const hours = Math.ceil(result.retryAfterMs / (60 * 60 * 1000));
    redirect(
      `/pasaporte?info=cooldown&restaurante=${encodeURIComponent(restaurante)}&horas=${hours}`
    );
  }

  redirect(
    `/pasaporte?sello=ok&restaurante=${encodeURIComponent(restaurante)}&nombre=${encodeURIComponent(result.restaurantName)}`
  );
}
