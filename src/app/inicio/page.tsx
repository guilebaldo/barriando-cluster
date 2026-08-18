import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Alias legacy del start_url PWA anterior.
 * La entrada unificada es `/` (sesión) o `/pases` (icono standalone).
 */
export default function InicioPage() {
  redirect("/");
}
