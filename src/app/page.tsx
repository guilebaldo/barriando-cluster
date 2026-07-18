import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-utils";
import { resolvePostAuthHomePath } from "@/lib/post-auth-home";

export const dynamic = "force-dynamic";

/**
 * Entrada del dominio y de la PWA.
 * Con sesión → home por rol. Sin sesión → presentación pública.
 */
export default async function RootPage() {
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

  redirect("/landing");
}
