import { Suspense } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import SiteShell from "@/app/components/SiteShell";
import { VerifyEmailClient } from "./VerifyEmailClient";

export const metadata = {
  title: "Revisa tu correo | Barriando",
};

export default function VerificarEmailPage() {
  return (
    <SiteShell>
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-6 py-12 w-full">
        <div className="w-full max-w-md">
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
            <Mail className="mx-auto mb-4 h-8 w-8 text-[#27366D]" />
            <h1 className="mb-2 font-serif-cluster text-xl font-bold uppercase tracking-wide">
              Revisa tu correo
            </h1>
            <Suspense fallback={<p className="text-xs text-slate-500 font-light">Cargando…</p>}>
              <VerifyEmailClient />
            </Suspense>
            <p className="mt-6 text-xs text-slate-500">
              <Link href="/login" className="font-bold text-[#27366D] hover:underline">
                Volver a iniciar sesión
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </SiteShell>
  );
}
