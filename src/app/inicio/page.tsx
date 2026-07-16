import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-utils";
import { resolvePostAuthHomePath } from "@/lib/post-auth-home";

export const dynamic = "force-dynamic";

/**
 * Punto de entrada del acceso directo PWA (manifest start_url).
 * Con sesión: home por rol (admin/vecino → BarrID, negocio → panel, turista → MAP).
 * Sin sesión: landing pública.
 */
export default async function InicioPage() {
  const session = await getSession();

  if (session) {
    redirect(
      resolvePostAuthHomePath({
        email: session.email,
        role: session.role,
        plan: session.plan,
        subscriptionStatus: session.subscriptionStatus,
      })
    );
  }

  redirect("/");
}
