import { notFound, redirect } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { getSession } from "@/lib/auth-utils";
import { isAdminUser } from "@/lib/admin";
import AdminShell from "@/app/admin/AdminShell";
import AdminPaseEventDetail from "@/app/admin/AdminPaseEventDetail";
import { getAccessEventForAdmin, listAccessEventHosts } from "@/app/admin/pases-actions";

export const dynamic = "force-dynamic";

export default async function AdminPaseEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/admin");
  if (!isAdminUser(session)) redirect("/panel");

  const { eventId } = await params;
  const [event, hosts] = await Promise.all([
    getAccessEventForAdmin(eventId),
    listAccessEventHosts(),
  ]);
  if (!event) notFound();

  return (
    <AdminShell>
      <Navbar />
      <main className="admin-touch-forms flex-1 min-h-0 w-full max-w-7xl mx-auto pt-[max(1rem,calc(env(safe-area-inset-top,0px)+0.5rem))] pb-6 sm:py-12 px-3 sm:px-6 overflow-y-auto overflow-x-hidden overscroll-y-none md:overflow-visible md:overscroll-auto">
        <AdminPaseEventDetail event={event} hosts={hosts} />
      </main>
      <div className="hidden md:block shrink-0">
        <Footer />
      </div>
    </AdminShell>
  );
}
