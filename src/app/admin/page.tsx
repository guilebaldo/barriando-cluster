import { redirect } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import AdminDashboard from "./AdminDashboard";
import { getSession } from "@/lib/auth-utils";
import { isAdminUser } from "@/lib/admin";
import { listAdminUsers, listTestimonials, listHomePromos } from "./actions";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdminUser(session)) redirect("/panel");

  const users = await listAdminUsers();
  const testimonials = await listTestimonials();
  const homePromos = await listHomePromos();

  return (
    <SiteShell>
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto py-12 px-6 w-full">
        <AdminDashboard users={users} testimonials={testimonials} homePromos={homePromos} />
      </main>
      <Footer />
    </SiteShell>
  );
}
