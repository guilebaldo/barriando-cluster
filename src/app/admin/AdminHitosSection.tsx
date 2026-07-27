"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createMapMilestone,
  updateMapMilestone,
  deleteMapMilestone,
  toggleMapMilestoneActive,
  importMapMilestonesFromCsv,
  type MapMilestoneRow,
} from "./actions";
import { Pencil, Plus, Trash2, ToggleLeft, ToggleRight, Upload } from "lucide-react";
import AdminConfirmDialog from "./AdminConfirmDialog";

const emptyForm = {
  name: "",
  description: "",
  mapsUrl: "",
  latitude: "",
  longitude: "",
  zone: "",
  businessId: "",
};

export default function AdminHitosSection({ milestones }: { milestones: MapMilestoneRow[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(emptyForm);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function openEdit(row: MapMilestoneRow) {
    setEditingId(row.id);
    setForm({
      name: row.name,
      description: row.description ?? "",
      mapsUrl: row.mapsUrl,
      latitude: String(row.latitude),
      longitude: String(row.longitude),
      zone: row.zone != null ? String(row.zone) : "",
      businessId: row.businessId != null ? String(row.businessId) : "",
    });
  }

  function payloadFromForm() {
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    const zoneRaw = form.zone.trim();
    const bizRaw = form.businessId.trim();
    return {
      name: form.name,
      description: form.description,
      mapsUrl: form.mapsUrl,
      latitude: lat,
      longitude: lng,
      zone: zoneRaw ? Number(zoneRaw) : null,
      businessId: bizRaw ? Number(bizRaw) : null,
    };
  }

  async function handleSave() {
    setMsg("");
    setBusy(true);
    const payload = payloadFromForm();
    const result = editingId
      ? await updateMapMilestone(editingId, payload)
      : await createMapMilestone(payload);
    setBusy(false);
    if (!result.ok) {
      setMsg(result.error ?? "Error");
      return;
    }
    resetForm();
    setMsg(editingId ? "Hito actualizado." : "Hito creado.");
    router.refresh();
  }

  async function handleToggle(id: string) {
    setMsg("");
    const result = await toggleMapMilestoneActive(id);
    if (!result.ok) {
      setMsg(result.error ?? "Error");
      return;
    }
    router.refresh();
  }

  async function handleImport() {
    setMsg("");
    setBusy(true);
    const result = await importMapMilestonesFromCsv();
    setBusy(false);
    if (!result.ok) {
      setMsg(result.error ?? "Error al importar");
      return;
    }
    setMsg(`Importados ${result.imported ?? 0} hitos desde CSV.`);
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setBusy(true);
    const result = await deleteMapMilestone(deleteId);
    setBusy(false);
    setDeleteId(null);
    if (!result.ok) {
      setMsg(result.error ?? "Error");
      return;
    }
    if (editingId === deleteId) resetForm();
    setMsg("Hito eliminado.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-[#27366D] uppercase tracking-widest">
          Hitos MAPA ({milestones.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleImport()}
            className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-[#27366D] disabled:opacity-40"
          >
            <Upload className="w-3.5 h-3.5" /> Importar CSV
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-700 hover:text-amber-600"
          >
            <Plus className="w-3.5 h-3.5" /> Nuevo
          </button>
        </div>
      </div>

      {msg && (
        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          {msg}
        </p>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {editingId ? "Editar hito" : "Nuevo hito"}
        </p>
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <input
            className="border border-slate-200 rounded-lg p-2 sm:col-span-2"
            placeholder="Nombre (único)"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <textarea
            className="border border-slate-200 rounded-lg p-2 sm:col-span-2 min-h-[72px]"
            placeholder="Descripción (ficha del mapa)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <input
            className="border border-slate-200 rounded-lg p-2 sm:col-span-2"
            placeholder="URL Google Maps"
            value={form.mapsUrl}
            onChange={(e) => setForm((f) => ({ ...f, mapsUrl: e.target.value }))}
          />
          <input
            className="border border-slate-200 rounded-lg p-2"
            placeholder="Latitud"
            type="number"
            step="any"
            value={form.latitude}
            onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
          />
          <input
            className="border border-slate-200 rounded-lg p-2"
            placeholder="Longitud"
            type="number"
            step="any"
            value={form.longitude}
            onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
          />
          <input
            className="border border-slate-200 rounded-lg p-2"
            placeholder="Zona (opcional)"
            type="number"
            value={form.zone}
            onChange={(e) => setForm((f) => ({ ...f, zone: e.target.value }))}
          />
          <input
            className="border border-slate-200 rounded-lg p-2"
            placeholder="socioId / businessId (opcional)"
            type="number"
            value={form.businessId}
            onChange={(e) => setForm((f) => ({ ...f, businessId: e.target.value }))}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleSave()}
            className="bg-[#27366D] hover:bg-[#1e2b58] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg disabled:opacity-40"
          >
            {editingId ? "Guardar cambios" : "Crear hito"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 px-3 py-2"
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-left text-[10px] uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3 hidden sm:table-cell">Zona</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {milestones.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  Sin hitos en la base. Usa «Importar CSV» para cargar el inventario MAPA.
                </td>
              </tr>
            ) : (
              milestones.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{row.name}</p>
                    {row.description ? (
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{row.description}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-slate-500">
                    {row.zone ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        row.active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {row.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => void handleToggle(row.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                        aria-label={row.active ? "Desactivar" : "Activar"}
                        title={row.active ? "Desactivar" : "Activar"}
                      >
                        {row.active ? (
                          <ToggleRight className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                        aria-label="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(row.id)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AdminConfirmDialog
        open={Boolean(deleteId)}
        title="Eliminar hito"
        description="Se borrará este hito de forma permanente del MAPA."
        confirmLabel="Eliminar"
        danger
        busy={busy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
