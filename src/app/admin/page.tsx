import { redirect } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AdminShell from "./AdminShell";
import AdminDashboard from "./AdminDashboard";
import { getSession } from "@/lib/auth-utils";
import { isAdminUser } from "@/lib/admin";
import {
  listAdminUsers,
  listTestimonials,
  listHomePromos,
  listCatalogSocioRows,
  listCatalogMemberships,
  listMapMilestones,
} from "./actions";
import { listAccessEventsForAdmin } from "./pases-actions";
import { expireMembershipsAfterGraceIfNeeded } from "@/lib/subscription-lifecycle";
import { reconcilePaidBusinessesIntoRoster } from "@/lib/publish-business";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdminUser(session)) redirect("/panel");

  await expireMembershipsAfterGraceIfNeeded();
  await reconcilePaidBusinessesIntoRoster();

  const params = await searchParams;
  const focus =
    params.focus === "payments" || params.focus === "linkages" ? params.focus : undefined;

  const [users, testimonials, homePromos, catalogRows, membershipRows, milestones, accessEvents] =
    await Promise.all([
      listAdminUsers(),
      listTestimonials(),
      listHomePromos(),
      listCatalogSocioRows(),
      listCatalogMemberships(),
      listMapMilestones(),
      listAccessEventsForAdmin(),
    ]);

  return (
    <AdminShell>
      <Navbar />
      <main className="admin-touch-forms flex-1 min-h-0 w-full max-w-7xl mx-auto pt-[max(1rem,calc(env(safe-area-inset-top,0px)+0.5rem))] pb-6 sm:py-12 px-3 sm:px-6 overflow-y-auto overflow-x-hidden overscroll-y-none md:overflow-visible md:overscroll-auto">
        <AdminDashboard
          users={users}
          testimonials={testimonials}
          homePromos={homePromos}
          catalogRows={catalogRows}
          membershipRows={membershipRows}
          milestones={milestones}
          accessEvents={accessEvents}
          initialFocus={focus}
        />
      </main>
      <div className="hidden md:block shrink-0">
        <Footer />
      </div>
    </AdminShell>
  );
}
