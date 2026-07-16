"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { resolvePostAuthHomePath } from "@/lib/post-auth-home";

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  // navigator.standalone: marcadores iOS agregados antes de cambiar start_url a /inicio.
  const iosStandalone = (window.navigator as { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia("(display-mode: standalone)").matches;
}

/**
 * En la landing `/`: si la página se abrió desde el icono instalado (PWA
 * standalone) y hay sesión, redirige al home por rol. La navegación normal
 * dentro del sitio (link "Inicio") no se ve afectada.
 */
export default function StandaloneHomeRedirect() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    if (!isStandaloneDisplay()) return;
    // Solo al entrar directo desde el icono, no al navegar de vuelta a "/".
    if (document.referrer) return;

    router.replace(
      resolvePostAuthHomePath({
        email: session.user.email,
        role: session.user.role,
        plan: session.user.plan ?? "TURISTA",
        subscriptionStatus: session.user.subscriptionStatus ?? "inactive",
      })
    );
  }, [status, session, router]);

  return null;
}
