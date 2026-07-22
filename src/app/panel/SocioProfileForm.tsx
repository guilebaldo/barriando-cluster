"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Save } from "lucide-react";
import { updateSocioProfile } from "./actions";
import BusinessProfileFields from "./BusinessProfileFields";
import type { SocioProfileFormInitial } from "./business-profile-types";
import { applyBillingSameFlags, toBusinessProfileFormInitial } from "@/lib/business-address";

export type { SocioProfileFormInitial } from "./business-profile-types";

interface SocioProfileFormProps {
  initial: SocioProfileFormInitial;
  email: string;
  disabled?: boolean;
  hideBusinessName?: boolean;
  embedded?: boolean;
  requireFiscal?: boolean;
  requirePrivacy?: boolean;
  onSave?: (
    payload: SocioProfileFormInitial
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  onSaved?: () => void;
  onDelete?: () => void;
  deleteDisabled?: boolean;
  deleteLabel?: string;
}

function profilesEqual(a: SocioProfileFormInitial, b: SocioProfileFormInitial): boolean {
  const keys = Object.keys(a) as (keyof SocioProfileFormInitial)[];
  return keys.every((k) => a[k] === b[k]);
}

/** Keeps a stable object identity while the normalized profile content is unchanged. */
function useStableProfile(
  initial: SocioProfileFormInitial,
  email: string,
): SocioProfileFormInitial {
  const normalized = toBusinessProfileFormInitial(initial, email);
  const ref = useRef(normalized);
  if (!profilesEqual(ref.current, normalized)) {
    ref.current = normalized;
  }
  return ref.current;
}

const SAVE_IDLE =
  "inline-flex items-center gap-2 bg-slate-100 text-slate-400 font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-lg cursor-not-allowed";
const SAVE_READY =
  "inline-flex items-center gap-2 bg-[#27366D] hover:bg-[#1e2b58] active:scale-95 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-lg transition-all";

export default function SocioProfileForm({
  initial,
  email,
  disabled,
  hideBusinessName,
  embedded = false,
  requireFiscal = true,
  requirePrivacy = false,
  onSave,
  onSaved,
  onDelete,
  deleteDisabled = false,
  deleteLabel = "Eliminar",
}: SocioProfileFormProps) {
  const baseline = useStableProfile(initial, email);
  const [committed, setCommitted] = useState<SocioProfileFormInitial>(baseline);
  const [form, setForm] = useState<SocioProfileFormInitial>(baseline);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCommitted(baseline);
    setForm(baseline);
    setMsg("");
  }, [baseline]);

  const isDirty = useMemo(() => !profilesEqual(form, committed), [form, committed]);
  const canSave = isDirty && !disabled && !loading;

  const set = <K extends keyof SocioProfileFormInitial>(
    key: K,
    value: SocioProfileFormInitial[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isDirty) return;
    if (requirePrivacy && !form.privacyAccepted) {
      setMsg("Debes aceptar el aviso de privacidad.");
      return;
    }
    if (form.latitude == null || form.longitude == null) {
      setMsg("Confirma la ubicación en el mapa.");
      return;
    }
    if (!form.billingSameAddress) {
      const missingBilling =
        !form.billingStreet.trim() ||
        !form.billingStreetNumber.trim() ||
        !form.billingColonia.trim() ||
        !(form.billingMunicipio.trim() || form.billingCiudad.trim()) ||
        !form.billingEstado.trim() ||
        !form.billingPais.trim() ||
        !form.billingCodigoPostal.trim();
      if (missingBilling) {
        setMsg("Completa la dirección fiscal o marca «usar el mismo domicilio».");
        return;
      }
    }
    if (!form.billingSameWhatsapp && !form.billingWhatsapp.trim()) {
      setMsg("Indica el WhatsApp fiscal o marca «usar el mismo».");
      return;
    }
    if (!form.billingSameEmail && !form.billingEmail.trim()) {
      setMsg("Indica el email fiscal o marca «usar el mismo».");
      return;
    }

    setMsg("");
    setLoading(true);
    const payload = applyBillingSameFlags(form);
    try {
      const result = onSave
        ? await onSave(payload)
        : await updateSocioProfile(payload);
      if (!result.ok) {
        setMsg(result.error);
        return;
      }
      const normalized = toBusinessProfileFormInitial(payload, email);
      setForm(normalized);
      setCommitted(normalized);
      setMsg("Datos guardados.");
      onSaved?.();
    } finally {
      setLoading(false);
    }
  }

  const formBody = (
    <form onSubmit={handleSubmit} className="space-y-6">
      <BusinessProfileFields
        form={form}
        set={set}
        disabled={disabled || loading}
        requireFiscal={requireFiscal}
        requirePrivacy={requirePrivacy}
        hideBusinessName={hideBusinessName}
      />

      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
        <button
          type="submit"
          disabled={!canSave}
          className={canSave ? SAVE_READY : SAVE_IDLE}
        >
          <Save className="w-4 h-4" />
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
        {onDelete ? (
          <button
            type="button"
            disabled={disabled || loading || deleteDisabled}
            onClick={onDelete}
            className="inline-flex items-center gap-2 bg-white hover:bg-red-50 border border-red-200 text-red-700 font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-lg disabled:opacity-40 transition-all"
          >
            {deleteLabel}
          </button>
        ) : null}
        {msg ? <p className="text-xs text-slate-600">{msg}</p> : null}
        {isDirty && !msg ? (
          <p className="text-[10px] text-amber-700">Tienes cambios sin guardar</p>
        ) : null}
      </div>
      <p className="text-[10px] text-slate-400">
        {requireFiscal ? "* Campos obligatorios" : "Sin cuenta: solo nombre y web se persisten en roster"}
      </p>
    </form>
  );

  if (embedded) return formBody;

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm md:col-span-2">
      <h2 className="text-xs font-bold text-[#27366D] uppercase tracking-widest mb-4">
        Perfil del negocio
      </h2>
      {formBody}
    </section>
  );
}
