import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-utils";
import { resolvePostAuthHomePath } from "@/lib/post-auth-home";
import { revertSoftUnpaidPlanIntentIfNeeded } from "@/lib/onboarding";

export const dynamic = "force-dynamic";

/**
 * Entrada del dominio y de la PWA.
 * Con sesión → home por rol. Sin sesión → presentación pública.
 */
export default async function RootPage() {
  const session = await getSession();

  if (session) {
    const sub = await revertSoftUnpaidPlanIntentIfNeeded(session.id);
    redirect(
      resolvePostAuthHomePath({
        email: session.email,
        role: session.role,
        plan: sub?.plan ?? session.plan,
        subscriptionStatus: sub?.status ?? session.subscriptionStatus,
        paymentMethod: sub?.paymentMethod ?? null,
      })
    );
  }

  redirect("/landing");
}
