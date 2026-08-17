import Link from "next/link";
import type { Metadata } from "next";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import SiteShell from "@/app/components/SiteShell";
import { getSession } from "@/lib/auth-utils";
import { getPublishedAccessEventById } from "@/lib/access-marketplace";
import { formatAccessWhen } from "@/lib/access-events";
import { isBarrioPassEventTitle } from "@/lib/barriopass";
import { redirect } from "next/navigation";
import PaseEventClient from "../PaseEventClient";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ eventId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { eventId } = await params;
  const event = await getPublishedAccessEventById(eventId);
  if (!event) {
    return { title: "Pase no encontrado | Barriando" };
  }
  const when = formatAccessWhen(event.startsAt, event.endsAt);
  return {
    title: `${event.title} | Pases | Barriando`,
    description: event.description?.trim()
      ? event.description
      : `${when} · ${event.venue}`,
  };
}

export default async function PaseEventPage({ params }: PageProps) {
  const { eventId } = await params;
  const session = await getSession();
  const event = await getPublishedAccessEventById(eventId);

  if (event && isBarrioPassEventTitle(event.title)) {
    const sku = event.title.includes("C3") ? "c3" : "classic";
    redirect(`/barriopass?sku=${sku}`);
  }

  if (!event) {
    return (
      <SiteShell>
        <Navbar />
        <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-[max(2rem,calc(env(safe-area-inset-top,0px)+1rem))] pb-8 md:py-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center space-y-3">
            <h1 className="text-xl font-black uppercase tracking-wide text-slate-950 font-sans">
              Pase no encontrado
            </h1>
            <p className="text-sm text-slate-500 font-light">
              Ese enlace ya no está disponible o el evento no está publicado.
            </p>
            <Link
              href="/pases"
              className="inline-flex text-[11px] font-bold uppercase tracking-wider text-[#27366D] hover:text-amber-600"
            >
              Ver pases
            </Link>
          </div>
        </main>
        <Footer />
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <Navbar />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-[max(2rem,calc(env(safe-area-inset-top,0px)+1rem))] pb-8 md:py-12">
        <PaseEventClient event={event} signedIn={Boolean(session)} />
      </main>
      <Footer />
    </SiteShell>
  );
}
