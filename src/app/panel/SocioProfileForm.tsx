"use client";

import { useState } from "react";
import { Building2, Save } from "lucide-react";
import { updateSocioProfile } from "./actions";

interface SocioProfileFormProps {
  initial: {
    businessName: string;
    website: string;
    googleBusinessUrl: string;
    logoUrl: string;
  };
  disabled?: boolean;
}

export default function SocioProfileForm({ initial, disabled }: SocioProfileFormProps) {
  const [businessName, setBusinessName] = useState(initial.businessName);
  const [website, setWebsite] = useState(initial.website);
  const [googleBusinessUrl, setGoogleBusinessUrl] = useState(initial.googleBusinessUrl);
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    const result = await updateSocioProfile({
      businessName,
      website,
      googleBusinessUrl,
      logoUrl,
    });
    setLoading(false);
    if (!result.ok) {
      setMsg(result.error);
      return;
    }
    setMsg("Perfil actualizado correctamente.");
  }

  const inputClass =
    "w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#27366D]/20";

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm md:col-span-2">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-4 h-4 text-[#27366D]" />
        <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">
          Editar perfil del negocio
        </h2>
      </div>
      <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
        <label className="block sm:col-span-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Nombre del negocio
          </span>
          <input
            type="text"
            required
            disabled={disabled || loading}
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Sitio web
          </span>
          <input
            type="url"
            required
            disabled={disabled || loading}
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://"
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Google My Business
          </span>
          <input
            type="url"
            required
            disabled={disabled || loading}
            value={googleBusinessUrl}
            onChange={(e) => setGoogleBusinessUrl(e.target.value)}
            placeholder="https://maps.google.com/..."
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            URL pública de imagen (logo temporal)
          </span>
          <input
            type="url"
            disabled={disabled || loading}
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://ejemplo.com/mi-logo.png"
            className={`${inputClass} mt-1`}
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Mientras habilitamos el almacenamiento de archivos, puedes pegar la URL de tu logotipo.
          </p>
        </label>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={disabled || loading}
            className="inline-flex items-center gap-2 bg-[#27366D] hover:bg-[#1e2b58] text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-lg disabled:opacity-50 transition"
          >
            <Save className="w-4 h-4" />
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
          {msg && <p className="text-xs text-slate-600">{msg}</p>}
        </div>
      </form>
    </section>
  );
}
