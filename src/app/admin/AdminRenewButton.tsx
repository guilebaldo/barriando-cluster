"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { renewCatalogMembership } from "./actions";
import { playCuelume } from "./useAdminCuelume";

type Props = {
  socioId: number;
  businessName: string;
  disabled?: boolean;
  /** Icono (fila de escritorio) o botón con texto (móvil). */
  variant?: "icon" | "labeled";
};

export default function AdminRenewButton({
  socioId,
  businessName,
  disabled,
  variant = "icon",
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (disabled || busy) return;
    setBusy(true);
    const result = await renewCatalogMembership(socioId);
    setBusy(false);
    if (!result.ok) {
      playCuelume("error");
      return;
    }
    playCuelume("success");
    router.refresh();
  }

  const label = busy ? "Renovando…" : "Renovar";

  if (variant === "labeled") {
    return (
      <button
        type="button"
        title="Validar / renovar al siguiente aniversario mensual"
        disabled={disabled || busy}
        onClick={() => void handleClick()}
        data-cuelume-press=""
        data-cuelume-release=""
        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 disabled:opacity-40"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`} />
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      title="Validar / renovar al siguiente aniversario mensual"
      disabled={disabled || busy}
      onClick={() => void handleClick()}
      data-cuelume-press=""
      data-cuelume-release=""
      className="p-2 rounded-lg text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
    >
      <RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} />
      <span className="sr-only">Renovar {businessName}</span>
    </button>
  );
}
