"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import { deleteOwnTuristaAccount } from "./actions";

/** Enlace discreto al pie de Ajustes (móvil, Turista). */
export default function DeleteTuristaAccountLink() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    const result = await deleteOwnTuristaAccount();
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    await signOut({ callbackUrl: "/" });
  }

  return (
    <>
      <div className="pt-2 pb-4 text-center">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setConfirmOpen(true);
          }}
          className="text-[11px] text-slate-400 hover:text-slate-500 underline decoration-dotted underline-offset-2 transition touch-manipulation"
        >
          Eliminar cuenta
        </button>
        {error ? (
          <p className="mt-2 text-[11px] text-red-600 px-4">{error}</p>
        ) : null}
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar cuenta"
        message="Se borrarán tu Pasaporte, sellos y datos de Turista. Esta acción no se puede deshacer."
        confirmLabel={loading ? "Eliminando…" : "Eliminar cuenta"}
        cancelLabel="Cancelar"
        loading={loading}
        onCancel={() => {
          if (loading) return;
          setConfirmOpen(false);
        }}
        onConfirm={() => {
          void handleConfirm();
        }}
      />
    </>
  );
}
