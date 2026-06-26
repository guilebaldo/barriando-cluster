"use client";

import { useState } from "react";
import { Banknote, Copy, Check } from "lucide-react";
import {
  BARRIANDO_BANK_LABEL,
  BARRIANDO_CLABE,
  BARRIANDO_PAYMENT_EMAIL,
} from "@/lib/payment";
import type { MembershipPlan } from "@/generated/prisma/client";

interface TransferPaymentSectionProps {
  plan: MembershipPlan;
  onConfirm: (plan: MembershipPlan) => Promise<void>;
  disabled?: boolean;
}

export default function TransferPaymentSection({
  plan,
  onConfirm,
  disabled,
}: TransferPaymentSectionProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(BARRIANDO_CLABE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function handleConfirm() {
    setSubmitting(true);
    await onConfirm(plan);
    setSubmitting(false);
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 border border-[#27366D] text-[#27366D] hover:bg-slate-50 font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-lg transition disabled:opacity-50"
      >
        <Banknote className="w-4 h-4" />
        Solicitar Pago por Transferencia/Efectivo
      </button>

      {open && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-3 text-xs text-slate-700">
          <p className="font-semibold text-[#27366D] uppercase tracking-wider">
            Datos para transferencia
          </p>
          <p>
            <span className="text-slate-500">Banco / beneficiario:</span>{" "}
            <strong>{BARRIANDO_BANK_LABEL}</strong>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500">CLABE:</span>
            <code className="bg-white border border-slate-200 px-2 py-1 rounded font-mono text-sm tracking-wide">
              {BARRIANDO_CLABE}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 bg-[#27366D] text-white px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider hover:bg-[#1e2b58] transition"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copiada" : "Copiar CLABE"}
            </button>
          </div>
          <p className="leading-relaxed">
            Realiza tu transferencia o depósito y envía tu comprobante a{" "}
            <a
              href={`mailto:${BARRIANDO_PAYMENT_EMAIL}`}
              className="text-[#27366D] font-semibold underline"
            >
              {BARRIANDO_PAYMENT_EMAIL}
            </a>
            . Tu plan quedará como <strong>Pendiente de Validación</strong> hasta que el equipo
            confirme el pago.
          </p>
          <button
            type="button"
            disabled={submitting || disabled}
            onClick={handleConfirm}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {submitting ? "Registrando solicitud..." : "Ya realicé el pago — enviar solicitud"}
          </button>
        </div>
      )}
    </div>
  );
}
