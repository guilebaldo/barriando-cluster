"use client";

import { useState } from "react";
import { Gift, QrCode } from "lucide-react";
import { updateSocioBenefit } from "./actions";

type BenefitFormProps = {
  initial: {
    offersBenefit: boolean;
    benefitTitle: string;
    benefitDescription: string;
    benefitHowToRedeem: string;
    benefitRedeemViaQr: boolean;
    benefitValidFrom: string | null;
    benefitValidUntil: string | null;
  };
  onSaved?: () => void;
  embedded?: boolean;
  onSave?: (payload: {
    offersBenefit: boolean;
    benefitTitle: string;
    benefitDescription: string;
    benefitHowToRedeem: string;
    benefitRedeemViaQr: boolean;
    benefitValidFrom: string;
    benefitValidUntil: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  onDelete?: () => void;
  deleteDisabled?: boolean;
};

function toDateInput(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function SocioBenefitForm({
  initial,
  onSaved,
  embedded = false,
  onSave,
  onDelete,
  deleteDisabled = false,
}: BenefitFormProps) {
  const [offersBenefit, setOffersBenefit] = useState(initial.offersBenefit);
  const [benefitTitle, setBenefitTitle] = useState(initial.benefitTitle);
  const [benefitDescription, setBenefitDescription] = useState(initial.benefitDescription);
  const [benefitHowToRedeem, setBenefitHowToRedeem] = useState(initial.benefitHowToRedeem);
  const [benefitRedeemViaQr, setBenefitRedeemViaQr] = useState(initial.benefitRedeemViaQr);
  const [benefitValidFrom, setBenefitValidFrom] = useState(toDateInput(initial.benefitValidFrom));
  const [benefitValidUntil, setBenefitValidUntil] = useState(toDateInput(initial.benefitValidUntil));
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    const payload = {
      offersBenefit,
      benefitTitle,
      benefitDescription,
      benefitHowToRedeem,
      benefitRedeemViaQr,
      benefitValidFrom,
      benefitValidUntil,
    };
    const result = onSave ? await onSave(payload) : await updateSocioBenefit(payload);
    setLoading(false);
    if (!result.ok) {
      setMsg(result.error);
      return;
    }
    setMsg("Beneficio guardado.");
    onSaved?.();
  }

  const formBody = (
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

            <fieldset className="space-y-2">
              <legend className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                Cómo se valida
              </legend>
              <label className="flex items-start gap-2 text-sm text-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="redeem-method"
                  checked={benefitRedeemViaQr}
                  onChange={() => setBenefitRedeemViaQr(true)}
                  className="mt-1"
                />
                <span>
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <QrCode className="w-3.5 h-3.5 text-[#27366D]" />
                    Escaneando el QR de BarrID
                  </span>
                  <span className="block text-xs text-slate-500 font-light mt-0.5">
                    En el popup de /socios se muestra el QR del socio; el negocio lo escanea para
                    validar.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2 text-sm text-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="redeem-method"
                  checked={!benefitRedeemViaQr}
                  onChange={() => setBenefitRedeemViaQr(false)}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium">Instrucciones por escrito</span>
                  <span className="block text-xs text-slate-500 font-light mt-0.5">
                    Describes cómo canjearlo y el socio usa el botón hacia BarrID si hace falta.
                  </span>
                </span>
              </label>
            </fieldset>

            {!benefitRedeemViaQr && (
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
                  placeholder="Ej. Menciona Barriando al pagar y muestra tu membresía"
                  required={offersBenefit && !benefitRedeemViaQr}
                />
              </div>
            )}

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

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#27366D] hover:bg-[#1e2b58] text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg transition disabled:opacity-60"
          >
            {loading ? "Guardando…" : "Guardar beneficio"}
          </button>
          {onDelete ? (
            <button
              type="button"
              disabled={loading || deleteDisabled}
              onClick={onDelete}
              className="bg-white hover:bg-red-50 border border-red-200 text-red-700 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg transition disabled:opacity-40"
            >
              Eliminar
            </button>
          ) : null}
          {msg && <p className="text-xs text-slate-600">{msg}</p>}
        </div>
      </form>
  );

  if (embedded) return formBody;

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
        /socios y lo canjearán con su credencial.
      </p>
      {formBody}
    </section>
  );
}
