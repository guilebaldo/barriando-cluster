import { redirect } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import PasaporteInfoCard from "../components/PasaporteInfoCard";
import { getSession } from "@/lib/auth-utils";

export const metadata = {
  title: "Abre tu Pasaporte | Barriando",
  description:
    "Escanea QR, abre tu cuenta gratis y colecciona sellos del Centro Histórico. Hazte Poblano con el Pasaporte Digital Barriando.",
};

export default async function PasaporteInfoPage() {
  const session = await getSession();
  if (session) redirect("/pasaporte");

  return (
    <SiteShell>
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-5 sm:px-6 py-10 sm:py-14 w-full flex items-center">
        <PasaporteInfoCard />
      </main>
      <Footer />
    </SiteShell>
  );
}
