"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { OAuthButtons, AuthDivider } from "../components/OAuthButtons";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Credenciales incorrectas");
      return;
    }
    router.push("/panel");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Navbar />
      <main className="max-w-md mx-auto py-16 px-6">
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <LogIn className="w-5 h-5 text-[#27366D]" />
            <h1 className="text-xl font-bold font-serif-cluster uppercase tracking-wide">Iniciar sesión</h1>
          </div>

          <OAuthButtons />
          <AuthDivider />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Correo</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs focus:outline-[#27366D]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Contraseña</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs focus:outline-[#27366D]"
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#27366D] hover:bg-[#1e2b58] text-white font-bold py-3 rounded-lg text-xs uppercase tracking-widest transition disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar con correo"}
            </button>
          </form>

          <p className="text-xs text-slate-500 mt-6 text-center">
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="text-[#27366D] font-bold hover:underline">
              Regístrate como socio
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
