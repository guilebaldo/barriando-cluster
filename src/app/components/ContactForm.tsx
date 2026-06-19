"use client";

import React, { useState } from "react";

export default function ContactForm() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, mensaje }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar");
      setStatus("success");
      setNombre("");
      setEmail("");
      setMensaje("");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Error al enviar el mensaje");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
          Nombre completo o empresa
        </label>
        <input
          required
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs focus:outline-[#27366D] transition-colors focus:bg-white"
          placeholder="Ej. Tu nombre o negocio"
        />
      </div>
      <div>
        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
          Correo electrónico
        </label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs focus:outline-[#27366D] transition-colors focus:bg-white"
          placeholder="contacto@empresa.com"
        />
      </div>
      <div>
        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
          Mensaje
        </label>
        <textarea
          required
          rows={4}
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs focus:outline-[#27366D] transition-colors focus:bg-white"
          placeholder="Cuéntanos tu interés en el Clúster..."
        />
      </div>
      {status === "success" && (
        <p className="text-xs text-green-700 font-medium">Mensaje enviado. Te contactaremos pronto.</p>
      )}
      {status === "error" && <p className="text-xs text-red-600">{errorMsg}</p>}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-[#27366D] hover:bg-[#1e2b58] text-white font-bold py-3 rounded-lg text-xs uppercase tracking-widest transition shadow-sm mt-2 disabled:opacity-50"
      >
        {status === "loading" ? "Enviando..." : "Enviar mensaje"}
      </button>
    </form>
  );
}
