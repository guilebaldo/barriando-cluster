"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  createMapMilestone,
  updateMapMilestone,
  deleteMapMilestone,
  toggleMapMilestoneActive,
  importMapMilestonesFromCsv,
  type MapMilestoneRow,
} from "./actions";
import { ChevronLeft, Pencil, Plus, Trash2, ToggleLeft, ToggleRight, Upload } from "lucide-react";
import AdminConfirmDialog from "./AdminConfirmDialog";

const LeafletLocationPicker = dynamic(() => import("@/app/panel/LeafletLocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-56 rounded-xl border border-slate-200 bg-slate-100 animate-pulse sm:col-span-2" />
  ),
});

const PUEBLA_LAT = 19.043;
const PUEBLA_LNG = -98.198;

const SAVE_IDLE =
  "inline-flex items-center bg-slate-100 text-slate-400 font-bold text-xs uppercase tracking-wider min-h-11 px-4 py-2 rounded-lg cursor-not-allowed";
const SAVE_READY =
  "inline-flex items-center bg-[#27366D] hover:bg-[#1e2b58] text-white font-bold text-xs uppercase tracking-wider min-h-11 px-4 py-2 rounded-lg";

function googleMapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

const emptyForm = {
  name: "",
  description: "",
  mapsUrl: googleMapsUrl(PUEBLA_LAT, PUEBLA_LNG),
  latitude: String(PUEBLA_LAT),
  longitude: String(PUEBLA_LNG),
  zone: "",
  businessId: "",
};

type HitoForm = typeof emptyForm;

function formsEqual(a: HitoForm, b: HitoForm): boolean {
  return (Object.keys(emptyForm) as (keyof HitoForm)[]).every((k) => a[k] === b[k]);
}

export default function AdminHitosSection({ milestones }: { milestones: MapMilestoneRow[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<HitoForm>(emptyForm);
  const [baseline, setBaseline] = useState<HitoForm>(emptyForm);

  function resetForm() {
    setForm(emptyForm);
    setBaseline(emptyForm);
    setEditingId(null);
    setFormOpen(false);
  }

  function startNew() {
    setForm(emptyForm);
    setBaseline(emptyForm);
    setEditingId(null);
    setFormOpen(true);
  }

  function openEdit(row: MapMilestoneRow) {
    const next: HitoForm = {
      name: row.name,
      description: row.description ?? "",
      mapsUrl: row.mapsUrl,
      latitude: String(row.latitude),
      longitude: String(row.longitude),
      zone: row.zone != null ? String(row.zone) : "",
      businessId: row.businessId != null ? String(row.businessId) : "",
    };
    setEditingId(row.id);
    setForm(next);
    setBaseline(next);
    setFormOpen(true);
  }

  function handlePinChange(lat: number, lng: number) {
    setForm((f) => {
      const prevLat = Number(f.latitude);
      const prevLng = Number(f.longitude);
      const prevAuto =
        Number.isFinite(prevLat) && Number.isFinite(prevLng) ? googleMapsUrl(prevLat, prevLng) : "";
      const mapsUrl =
        !f.mapsUrl.trim() || f.mapsUrl.trim() === prevAuto ? googleMapsUrl(lat, lng) : f.mapsUrl;
      return { ...f, latitude: String(lat), longitude: String(lng), mapsUrl };
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

  const isDirty = useMemo(() => !formsEqual(form, baseline), [form, baseline]);
  const lat = Number(form.latitude);
  const lng = Number(form.longitude);
  const coordsOk = Number.isFinite(lat) && Number.isFinite(lng);
  const fieldsValid = form.name.trim().length >= 2 && coordsOk && form.mapsUrl.trim().length > 0;
  /** Crear: campos listos. Editar: además tiene que haber cambios. */
  const canSave = !busy && fieldsValid && (editingId ? isDirty : true);

  async function handleSave() {
    if (!canSave) return;
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
    const wasEdit = Boolean(editingId);
    resetForm();
    setMsg(wasEdit ? "Hito actualizado." : "Hito creado.");
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

  function HitoActions({ row, labeled }: { row: MapMilestoneRow; labeled?: boolean }) {
    const btn = labeled
      ? "inline-flex items-center justify-center gap-1.5 min-h-11 rounded-lg px-3 text-[11px] font-bold uppercase tracking-wider"
      : "p-1.5 rounded-lg text-slate-500 hover:bg-slate-100";
    return (
      <div className={labeled ? "grid grid-cols-3 gap-2" : "flex items-center justify-end gap-1"}>
        <button
          type="button"
          onClick={() => void handleToggle(row.id)}
          className={labeled ? `${btn} bg-slate-100 text-slate-700` : btn}
          aria-label={row.active ? "Desactivar" : "Activar"}
          title={row.active ? "Desactivar" : "Activar"}
        >
          {row.active ? (
            <ToggleRight className="w-4 h-4 text-emerald-600" />
          ) : (
            <ToggleLeft className="w-4 h-4" />
          )}
          {labeled ? (row.active ? "Off" : "On") : null}
        </button>
        <button
          type="button"
          onClick={() => openEdit(row)}
          className={labeled ? `${btn} bg-slate-100 text-[#27366D]` : btn}
          aria-label="Editar"
        >
          <Pencil className="w-4 h-4" />
          {labeled ? "Editar" : null}
        </button>
        <button
          type="button"
          onClick={() => setDeleteId(row.id)}
          className={
            labeled ? `${btn} bg-red-50 text-red-600` : "p-1.5 rounded-lg text-red-500 hover:bg-red-50"
          }
          aria-label="Eliminar"
        >
          <Trash2 className="w-4 h-4" />
          {labeled ? "Borrar" : null}
        </button>
      </div>
    );
  }

  const formCard = (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {editingId ? "Editar hito" : "Nuevo hito"}
      </p>
      <div className="grid sm:grid-cols-2 gap-3 text-xs">
        <input
          className="border border-slate-200 rounded-lg p-2 sm:col-span-2"
          placeholder="Nombre (único) *"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <textarea
          className="border border-slate-200 rounded-lg p-2 sm:col-span-2 min-h-[72px]"
          placeholder="Descripción (ficha del mapa)"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
        <div className="sm:col-span-2">
          <LeafletLocationPicker
            latitude={coordsOk ? lat : PUEBLA_LAT}
            longitude={coordsOk ? lng : PUEBLA_LNG}
            onChange={handlePinChange}
            autoGeolocate={false}
            showCoordinates={false}
            hint="Toca el mapa o arrastra el pin para colocar el hito."
          />
        </div>
        <input
          className="border border-slate-200 rounded-lg p-2 sm:col-span-2"
          placeholder="URL Google Maps (se llena al mover el pin) *"
          value={form.mapsUrl}
          onChange={(e) => setForm((f) => ({ ...f, mapsUrl: e.target.value }))}
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
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!canSave}
          onClick={() => void handleSave()}
          className={canSave ? SAVE_READY : SAVE_IDLE}
          title={
            !fieldsValid
              ? "Completa nombre, ubicación y URL"
              : editingId && !isDirty
                ? "No hay cambios por guardar"
                : undefined
          }
        >
          {busy ? "Guardando..." : editingId ? "Guardar cambios" : "Crear hito"}
        </button>
        <button
          type="button"
          onClick={resetForm}
          className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 min-h-11 px-3"
        >
          Cancelar
        </button>
        {editingId && isDirty && !busy ? (
          <p className="text-[10px] text-amber-700">Tienes cambios sin guardar</p>
        ) : null}
        {!fieldsValid && !busy ? (
          <p className="text-[10px] text-slate-400">Nombre y ubicación son obligatorios</p>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-[#27366D] uppercase tracking-widest">
          <span className="md:hidden">
            {formOpen ? (editingId ? "Editar hito" : "Nuevo hito") : `Hitos MAPA (${milestones.length})`}
          </span>
          <span className="hidden md:inline">
            {formOpen ? (editingId ? "Editar hito" : "Nuevo hito") : `Hitos MAPA (${milestones.length})`}
          </span>
        </h2>
        <div className="flex flex-wrap gap-2">
          {!formOpen ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleImport()}
                className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-[#27366D] disabled:opacity-40 min-h-11"
              >
                <Upload className="w-3.5 h-3.5" /> Importar CSV
              </button>
              <button
                type="button"
                onClick={startNew}
                className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-700 hover:text-amber-600 min-h-11"
              >
                <Plus className="w-3.5 h-3.5" /> Nuevo
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-600 min-h-11"
            >
              <ChevronLeft className="w-4 h-4" /> Lista
            </button>
          )}
        </div>
      </div>

      {msg ? (
        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          {msg}
        </p>
      ) : null}

      {formOpen ? formCard : null}

      {!formOpen ? (
        <>
          <div className="md:hidden space-y-3">
            {milestones.length === 0 ? (
              <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-xl px-4 py-8 text-center">
                Sin hitos. Usa «Nuevo» o «Importar CSV».
              </p>
            ) : (
              milestones.map((row) => (
                <article key={row.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 leading-snug">{row.name}</p>
                      {row.description ? (
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{row.description}</p>
                      ) : null}
                      {row.zone != null ? (
                        <p className="text-[11px] text-slate-400 mt-0.5">Zona {row.zone}</p>
                      ) : null}
                    </div>
                    <span
                      className={`shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        row.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {row.active ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <HitoActions row={row} labeled />
                </article>
              ))
            )}
          </div>

          <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Zona</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {milestones.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      Sin hitos en la base. Usa «Importar CSV» o «Nuevo».
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
                      <td className="px-4 py-3 text-slate-500">{row.zone ?? "—"}</td>
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
                        <HitoActions row={row} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

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
