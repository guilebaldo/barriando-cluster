import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "BarrID | Barriando",
  description: "Credencial digital de membresía Barriando. Ahora vive en Mi cuenta.",
};

/** BarrID es Mi cuenta: enlaces viejos caen en /panel. */
export default async function BarrIdPage({
  searchParams,
}: {
  searchParams: Promise<{
    pago?: string;
    bienvenida?: string;
    success?: string;
  }>;
}) {
  const params = await searchParams;
  const q = new URLSearchParams();
  if (params.pago) q.set("pago", params.pago);
  if (params.bienvenida) q.set("bienvenida", params.bienvenida);
  if (params.success) q.set("success", params.success);
  const suffix = q.toString();
  redirect(suffix ? `/panel?${suffix}` : "/panel");
}
