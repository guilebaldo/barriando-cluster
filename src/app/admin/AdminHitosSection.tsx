"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, ToggleLeft, ToggleRight, Upload } from "lucide-react";
import {
  createMapMilestone,
  updateMapMilestone,
  deleteMapMilestone,
  toggleMapMilestoneActive,
  importMapMilestonesFromCsv,
  type MapMilestoneRow,
} from "./actions";
import AdminConfirmDialog from "./AdminConfirmDialog";

export default function AdminHitosSection({ milestones }: { milestones: MapMilestoneRow[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    mapsUrl: "",
    latitude: "",
    longitude: "",
    zone: "",
    active: true,
  });

  function resetForm() {
    setForm({
      name: "",
      description: "",
      mapsUrl: "",
      latitude: "",
      longitude: "",
      zone: "",
      active: true,
    });
    setEditingId(null);
  }

  function openEdit(row: MapMilestoneRow) {
    setEditingId(row.id);
    setForm({
      name: row.name,
      description: row.description,
      mapsUrl: row.mapsUrl,
      latitude: String(row.latitude),
      longitude: String(row.longitude),
      zone: row.zone != null ? String(row.zone) : "",
      active: row.active,
    });
  }

  async function handleSave() {
    setMsg("");
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setMsg("Latitud y longitud son obligatorias.");
      return;
    }
    const payload = {
      name: form.name,
      description: form.description,
      mapsUrl: form.mapsUrl,
      latitude: lat,
      longitude: lng,
      zone: form.zone.trim() ? Number(form.zone) : null,
      active: form.active,
    };
    const result = editingId
      ? await updateMapMilestone(editingId, payload)
      : await createMapMilestone(payload);
    if (!result.ok) {
      setMsg(result.error ?? "Error");
      return;
    }
    resetForm();
    setMsg(editingId ? "Hito actualizado." : "Hito creado.");
    router.refresh();
  }

  async function handleImport() {
    setBusy(true);
    setMsg("");
    const result = await importMapMilestonesFromCsv();
    setBusy(false);
    if (!result.ok) {
      setMsg(result.error);
      return;
    }
    setMsg(`Importados / actualizados ${result.imported} hitos desde CSV.`);
    router.refresh();
  }

  async function handleDelete() {
    if (!deleteId) return;
    setBusy(true);
    const result = await deleteMapMilestone(deleteId);
    setBusy(false);
    setDeleteId(null);
    if (!result.ok) {
      setMsg(result.error);
      return;
    }
    setMsg("Hito eliminado.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-[#27366D] uppercase tracking-widest">
          Hitos del MAP ({milestones.length})
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

      {msg ? (
        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          {msg}
        </p>
      ) : null}

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <input
            className="border border-slate-200 rounded-lg p-2 sm:col-span-2"
            placeholder="Título / nombre del hito"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <textarea
            className="border border-slate-200 rounded-lg p-2 sm:col-span-2 min-h-[80px]"
            placeholder="Descripción"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <input
            className="border border-slate-200 rounded-lg p-2 sm:col-span-2"
            placeholder="Enlace Google Maps (https://…)"
            value={form.mapsUrl}
            onChange={(e) => setForm((f) => ({ ...f, mapsUrl: e.target.value }))}
          />
          <input
            className="border border-slate-200 rounded-lg p-2"
            placeholder="Latitud"
            value={form.latitude}
            onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
          />
          <input
            className="border border-slate-200 rounded-lg p-2"
            placeholder="Longitud"
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
          <label className="inline-flex items-center gap-2 text-slate-600">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            Activo en el MAP
          </label>
        </div>
        <button
          type="button"
          onClick={() => void handleSave()}
          className="bg-[#27366D] hover:bg-[#1e2b58] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg"
        >
          {editingId ? "Guardar cambios" : "Crear hito"}
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Zona</th>
                <th className="px-3 py-2">Activo</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    <p className="font-semibold text-slate-900">{row.name}</p>
                    <p className="text-[10px] text-slate-500 line-clamp-1">{row.description}</p>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{row.zone ?? "—"}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      title="Activar / desactivar"
                      onClick={() => void toggleMapMilestoneActive(row.id).then(() => router.refresh())}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                    >
                      {row.active ? (
                        <ToggleRight className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        title="Editar"
                        onClick={() => openEdit(row)}
                        className="p-1.5 rounded-lg hover:bg-slate-100"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Eliminar"
                        onClick={() => setDeleteId(row.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {milestones.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                    No hay hitos en la base. Usa «Importar CSV» o crea uno nuevo.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <AdminConfirmDialog
        open={Boolean(deleteId)}
        danger
        busy={busy}
        title="Eliminar hito"
        description="Se quita del MAP. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onCancel={() => {
          if (!busy) setDeleteId(null);
        }}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
