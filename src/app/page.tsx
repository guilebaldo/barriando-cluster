import { redirect } from "next/navigation";
import HomePage from "./HomePage";
import { getLiveStats } from "@/lib/get-live-stats";
import { getActiveHomePromo } from "@/lib/home-content";
import { getCarouselSocios } from "@/lib/public-socios";
import { getSession } from "@/lib/auth-utils";
import { resolvePostAuthHomePath } from "@/lib/post-auth-home";

export default async function Page() {
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

  const [liveStats, homePromo, carouselSocios] = await Promise.all([
    getLiveStats(),
    getActiveHomePromo(),
    getCarouselSocios(),
  ]);

  return <HomePage liveStats={liveStats} homePromo={homePromo} carouselSocios={carouselSocios} />;
}
