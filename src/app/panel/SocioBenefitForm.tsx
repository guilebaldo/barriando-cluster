"use client";

import { useState } from "react";
import { Gift } from "lucide-react";
import { updateSocioBenefit } from "./actions";

type BenefitFormProps = {
  initial: {
    offersBenefit: boolean;
    benefitTitle: string;
    benefitDescription: string;
    benefitHowToRedeem: string;
    benefitValidFrom: string | null;
    benefitValidUntil: string | null;
  };
  onSaved?: () => void;
};

function toDateInput(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function SocioBenefitForm({ initial, onSaved }: BenefitFormProps) {
  const [offersBenefit, setOffersBenefit] = useState(initial.offersBenefit);
  const [benefitTitle, setBenefitTitle] = useState(initial.benefitTitle);
  const [benefitDescription, setBenefitDescription] = useState(initial.benefitDescription);
  const [benefitHowToRedeem, setBenefitHowToRedeem] = useState(initial.benefitHowToRedeem);
  const [benefitValidFrom, setBenefitValidFrom] = useState(toDateInput(initial.benefitValidFrom));
  const [benefitValidUntil, setBenefitValidUntil] = useState(toDateInput(initial.benefitValidUntil));
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    const result = await updateSocioBenefit({
      offersBenefit,
      benefitTitle,
      benefitDescription,
      benefitHowToRedeem,
      benefitValidFrom,
      benefitValidUntil,
    });
    setLoading(false);
    if (!result.ok) {
      setMsg(result.error);
      return;
    }
    setMsg("Beneficio guardado.");
    onSaved?.();
  }

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Gift className="w-4 h-4 text-[#27366D]" />
        <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest">
          Beneficio para socios
        </h2>
      </div>
      <p className="text-xs text-slate-500 mb-4 font-light leading-relaxed">
        Ofrece un beneficio especial a Vecinos y otros socios con membresía activa. Ellos lo verán en
        /socios y lo canjearán mostrando su credencial QR.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="flex items-center gap-2 text-sm text-slate-800">
          <input
            type="checkbox"
            checked={offersBenefit}
            onChange={(e) => setOffersBenefit(e.target.checked)}
            className="rounded border-slate-300"
          />
          Publicar beneficio para socios de pago
        </label>

        {offersBenefit && (
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                Título
              </label>
              <input
                value={benefitTitle}
                onChange={(e) => setBenefitTitle(e.target.value)}
                maxLength={120}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Ej. 10% de descuento en consumo"
                required={offersBenefit}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                Qué ofrece
              </label>
              <textarea
                value={benefitDescription}
                onChange={(e) => setBenefitDescription(e.target.value)}
                maxLength={600}
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Describe el beneficio con claridad"
                required={offersBenefit}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                Cómo se hace válido
              </label>
              <textarea
                value={benefitHowToRedeem}
                onChange={(e) => setBenefitHowToRedeem(e.target.value)}
                maxLength={600}
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Ej. Muestra tu credencial QR al mesero y menciona Barriando"
                required={offersBenefit}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  Vigente desde
                </label>
                <input
                  type="date"
                  value={benefitValidFrom}
                  onChange={(e) => setBenefitValidFrom(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  Vigente hasta
                </label>
                <input
                  type="date"
                  value={benefitValidUntil}
                  onChange={(e) => setBenefitValidUntil(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-[#27366D] hover:bg-[#1e2b58] text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg transition disabled:opacity-60"
        >
          {loading ? "Guardando…" : "Guardar beneficio"}
        </button>
        {msg && <p className="text-xs text-slate-600">{msg}</p>}
      </form>
    </section>
  );
}
