"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Mail } from "lucide-react";

type MagicLinkFormProps = {
  callbackUrl: string;
  /** Texto del botón principal */
  submitLabel?: string;
};

export function MagicLinkForm({
  callbackUrl,
  submitLabel = "Enviar enlace de acceso",
}: MagicLinkFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Escribe un correo válido.");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn("resend", {
        email: trimmed,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError(
          result.error === "Configuration"
            ? "El envío por correo no está configurado. Usa Google o contacta soporte."
            : "No se pudo enviar el enlace. Revisa el correo e intenta de nuevo."
        );
        return;
      }

      const verifyUrl = `/login/verificar-email?email=${encodeURIComponent(trimmed)}`;
      router.push(verifyUrl);
    } catch {
      setError("Error al enviar el enlace. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block">
        <span className="sr-only">Correo electrónico</span>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            placeholder="tu@correo.com"
            disabled={loading}
            className="w-full rounded-lg border border-slate-200 bg-white py-3.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#27366D] focus:outline-none focus:ring-1 focus:ring-[#27366D] disabled:opacity-50"
          />
        </div>
      </label>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[#27366D] py-3.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#1e2a55] disabled:opacity-50"
      >
        {loading ? "Enviando…" : submitLabel}
      </button>
      {error ? <p className="text-center text-xs text-red-600">{error}</p> : null}
    </form>
  );
}
