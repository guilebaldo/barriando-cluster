"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { OAuthButtons, AuthDivider } from "../components/OAuthButtons";
import { listaSocios } from "../data/socios";
import { UserPlus } from "lucide-react";

export default function RegistroPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [socioId, setSocioId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          email,
          password,
          socioId: socioId ? Number(socioId) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al registrar");

      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        router.push("/login");
        return;
      }
      router.push("/panel");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Navbar />
      <main className="max-w-md mx-auto py-16 px-6">
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="w-5 h-5 text-[#27366D]" />
            <h1 className="text-xl font-bold font-serif-cluster uppercase tracking-wide">Registro de socio</h1>
          </div>
          <p className="text-xs text-slate-500 mb-6 font-light">
            Crea tu cuenta para gestionar tu perfil, actualizar tu logo y pagar tu mensualidad.
          </p>

          <OAuthButtons />
          <AuthDivider />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Nombre completo</label>
              <input
                required
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs focus:outline-[#27366D]"
              />
            </div>
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
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs focus:outline-[#27366D]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Negocio socio (opcional)
              </label>
              <select
                value={socioId}
                onChange={(e) => setSocioId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs focus:outline-[#27366D]"
              >
                <option value="">Seleccionar negocio...</option>
                {listaSocios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#27366D] hover:bg-[#1e2b58] text-white font-bold py-3 rounded-lg text-xs uppercase tracking-widest transition disabled:opacity-50"
            >
              {loading ? "Registrando..." : "Crear cuenta con correo"}
            </button>
          </form>

          <p className="text-xs text-slate-500 mt-6 text-center">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-[#27366D] font-bold hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
