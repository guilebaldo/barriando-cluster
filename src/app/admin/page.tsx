import { redirect } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import AdminDashboard from "./AdminDashboard";
import { getSession } from "@/lib/auth-utils";
import { isAdminUser } from "@/lib/admin";
import {
  listAdminUsers,
  listTestimonials,
  listHomePromos,
  listCatalogSocioRows,
  listCatalogMemberships,
} from "./actions";
import { expireMembershipsAfterGraceIfNeeded } from "@/lib/subscription-lifecycle";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdminUser(session)) redirect("/panel");

  await expireMembershipsAfterGraceIfNeeded();

  const [users, testimonials, homePromos, catalogRows, membershipRows] = await Promise.all([
    listAdminUsers(),
    listTestimonials(),
    listHomePromos(),
    listCatalogSocioRows(),
    listCatalogMemberships(),
  ]);

  return (
    <SiteShell>
      <Navbar />
      <main className="flex-1 min-h-0 w-full max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 overflow-y-auto overflow-x-hidden">
        <AdminDashboard
          users={users}
          testimonials={testimonials}
          homePromos={homePromos}
          catalogRows={catalogRows}
          membershipRows={membershipRows}
        />
      </main>
      <Footer />
    </SiteShell>
  );
}
