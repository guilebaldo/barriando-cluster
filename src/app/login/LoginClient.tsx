"use client";

import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SiteShell from "../components/SiteShell";
import { OAuthButtons } from "../components/OAuthButtons";
import { LogIn } from "lucide-react";

export default function LoginClient() {
  return (
    <SiteShell>
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12 px-6 w-full">
        <div className="w-full max-w-md">
          <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
            <div className="flex flex-col items-center text-center gap-2 mb-6">
              <LogIn className="w-6 h-6 text-[#27366D]" />
              <h1 className="text-xl font-bold font-serif-cluster uppercase tracking-wide">Iniciar sesión</h1>
              <p className="text-xs text-slate-600 font-light mt-1">
                Accede con Google para entrar a tu cuenta Barriando.
              </p>
            </div>

            <OAuthButtons />

            <p className="text-xs text-slate-500 mt-6 text-center">
              ¿Aún no tienes cuenta?{" "}
              <Link href="/registro" className="text-[#27366D] font-bold hover:underline">
                Regístrate
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </SiteShell>
  );
}
