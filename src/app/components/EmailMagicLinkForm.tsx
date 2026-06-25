"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { ONBOARDING_CONTINUE_PATH } from "@/lib/plan-routing";
import { Mail } from "lucide-react";

export default function EmailMagicLinkForm({ submitLabel = "Enviar enlace mágico" }: { submitLabel?: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSent(false);

    try {
      const result = await signIn("resend", {
        email,
        redirectTo: ONBOARDING_CONTINUE_PATH,
        redirect: false,
      });

      if (result?.error) {
        setError("No pudimos enviar el enlace. Verifica tu correo e intenta de nuevo.");
        return;
      }

      setSent(true);
    } catch {
      setError("Error al enviar el enlace. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
        <Mail className="w-5 h-5 text-amber-600 mx-auto mb-2" />
        <p className="text-xs text-slate-700 font-medium">Revisa tu bandeja de entrada</p>
        <p className="text-[11px] text-slate-500 mt-1">
          Enviamos un enlace mágico a <strong>{email}</strong>. Haz clic para continuar.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
          Correo electrónico
        </label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs focus:outline-[#27366D]"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#27366D] hover:bg-[#1e2b58] text-white font-bold py-3 rounded-lg text-xs uppercase tracking-widest transition disabled:opacity-50"
      >
        {loading ? "Enviando..." : submitLabel}
      </button>
    </form>
  );
}
