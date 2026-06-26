import { redirect } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AdminDashboard from "./AdminDashboard";
import { getSession } from "@/lib/auth-utils";
import { isAdminEmail } from "@/lib/admin";
import { listAdminUsers } from "./actions";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAdminEmail(session.email)) redirect("/panel");

  const users = await listAdminUsers();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Navbar />
      <main className="max-w-6xl mx-auto py-12 px-6">
        <AdminDashboard users={users} />
      </main>
      <Footer />
    </div>
  );
}
