"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  createAccessEvent,
  updateAccessEvent,
  type AccessEventHostOption,
} from "./pases-actions";
import type { AccessEventCard } from "@/lib/access-events";
import { formatMexicoCityLocalInput } from "@/lib/mexico-city-time";

const LeafletLocationPicker = dynamic(() => import("@/app/panel/LeafletLocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-56 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-500">
      Cargando mapa…
    </div>
  ),
});

const SAVE_IDLE =
  "bg-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider min-h-11 px-4 py-2 rounded-lg cursor-not-allowed";
const SAVE_READY =
  "bg-[#27366D] hover:bg-[#1e2b58] text-white text-xs font-bold uppercase tracking-wider min-h-11 px-4 py-2 rounded-lg";

const emptyForm = {
  title: "",
  description: "",
  venue: "",
  hostId: "" as string,
  latitude: null as number | null,
  longitude: null as number | null,
  startsAt: "",
  endsAt: "",
  priceMxn: "",
  capacity: "",
};

function priceIsValid(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  const normalized = trimmed.replace(/,/g, ".").replace(/[^\d.]/g, "");
  if (!normalized) return false;
  const pesos = Number(normalized);
  return Number.isFinite(pesos) && pesos >= 0;
}

function formFromEvent(event: AccessEventCard, hosts: AccessEventHostOption[]) {
  const matched = hosts.find(
    (h) => h.name.trim().toLocaleLowerCase("es-MX") === event.venue.trim().toLocaleLowerCase("es-MX")
  );
  return {
    title: event.title,
    description: event.description,
    venue: event.venue,
    hostId: matched ? String(matched.id) : "",
    latitude: event.latitude,
    longitude: event.longitude,
    startsAt: formatMexicoCityLocalInput(event.startsAt),
    endsAt: formatMexicoCityLocalInput(event.endsAt),
    priceMxn: (event.priceCents / 100).toFixed(2),
    capacity: event.capacity != null ? String(event.capacity) : "",
  };
}

export default function AdminPaseEventForm({
  hosts,
  event,
  onCancel,
  onSaved,
}: {
  hosts: AccessEventHostOption[];
  event?: AccessEventCard;
  onCancel?: () => void;
  onSaved?: (id: string) => void;
}) {
  const [form, setForm] = useState(() => (event ? formFromEvent(event, hosts) : emptyForm));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const canSave = useMemo(
    () =>
      !busy &&
      form.title.trim().length > 0 &&
      form.venue.trim().length > 0 &&
      form.startsAt.trim().length > 0 &&
      priceIsValid(form.priceMxn),
    [busy, form.title, form.venue, form.startsAt, form.priceMxn]
  );

  function applyHost(hostId: string) {
    if (!hostId) {
      setForm((f) => ({ ...f, hostId: "" }));
      return;
    }
    const host = hosts.find((h) => String(h.id) === hostId);
    if (!host) {
      setForm((f) => ({ ...f, hostId }));
      return;
    }
    setForm((f) => ({
      ...f,
      hostId,
      venue: host.name,
      latitude: host.latitude,
      longitude: host.longitude,
    }));
  }

  async function handleSave() {
    if (!canSave) return;
    setMsg("");
    setOkMsg("");
    setBusy(true);
    const payload = {
      title: form.title,
      description: form.description,
      venue: form.venue,
      latitude: form.latitude,
      longitude: form.longitude,
      startsAt: form.startsAt,
      endsAt: form.endsAt.trim() || null,
      priceMxn: form.priceMxn,
      capacity: form.capacity.trim() || null,
      published: event ? event.published : false,
    };
    if (event) {
      const result = await updateAccessEvent(event.id, payload);
      setBusy(false);
      if (!result.ok) {
        setMsg(result.error ?? "Error");
        return;
      }
      onSaved?.(event.id);
      setOkMsg("Pase actualizado.");
      return;
    }
    const result = await createAccessEvent(payload);
    setBusy(false);
    if (!result.ok) {
      setMsg(result.error ?? "Error");
      return;
    }
    onSaved?.(result.id ?? "");
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {event ? "Editar pase" : "Nuevo pase"}
      </p>
      {okMsg ? (
        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{okMsg}</p>
      ) : null}
      {msg ? (
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{msg}</p>
      ) : null}
      <div className="grid sm:grid-cols-2 gap-3 text-xs">
        <input
          className="border border-slate-200 rounded-lg p-2 sm:col-span-2"
          placeholder="Título del evento"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
        <textarea
          className="border border-slate-200 rounded-lg p-2 sm:col-span-2 min-h-[80px]"
          placeholder="Descripción breve"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
        <select
          className="border border-slate-200 rounded-lg p-2 sm:col-span-2 bg-white"
          value={form.hostId}
          onChange={(e) => applyHost(e.target.value)}
        >
          <option value="">Otro / escribir lugar</option>
          {hosts.map((host) => (
            <option key={host.id} value={host.id}>
              {host.name}
              {host.category ? ` · ${host.category}` : ""}
            </option>
          ))}
        </select>
        <input
          className="border border-slate-200 rounded-lg p-2 sm:col-span-2"
          placeholder="Lugar (nombre visible)"
          value={form.venue}
          onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value, hostId: "" }))}
        />
        <div className="sm:col-span-2 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Ubicación en el mapa
          </p>
          <LeafletLocationPicker
            latitude={form.latitude}
            longitude={form.longitude}
            onChange={(lat, lng) => setForm((f) => ({ ...f, latitude: lat, longitude: lng }))}
            autoGeolocate={false}
            showCoordinates
            hint={
              form.hostId
                ? "Pin del socio. Ajústalo si el evento es en otro punto del local."
                : "Toca el mapa para colocar el marcador del evento."
            }
            className="h-56 rounded-xl overflow-hidden border border-slate-200"
          />
        </div>
        <label className="space-y-1">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Inicio (hora de Puebla)
          </span>
          <input
            className="border border-slate-200 rounded-lg p-2 w-full"
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
          />
        </label>
        <label className="space-y-1">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Cierre (opcional)
          </span>
          <input
            className="border border-slate-200 rounded-lg p-2 w-full"
            type="datetime-local"
            value={form.endsAt}
            onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
          />
        </label>
        <label className="space-y-1">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Monto en pesos
          </span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              $
            </span>
            <input
              className="border border-slate-200 rounded-lg p-2 w-full pl-7 pr-12"
              placeholder="0.00"
              inputMode="decimal"
              value={form.priceMxn}
              onChange={(e) => setForm((f) => ({ ...f, priceMxn: e.target.value }))}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              MXN
            </span>
          </div>
          <span className="block text-[10px] text-slate-400">0.00 = cortesía, sin cobro.</span>
        </label>
        <label className="space-y-1">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Cupo (opcional)
          </span>
          <input
            className="border border-slate-200 rounded-lg p-2 w-full"
            placeholder="Vacío = sin límite"
            inputMode="numeric"
            value={form.capacity}
            onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!canSave}
          onClick={() => void handleSave()}
          className={canSave ? SAVE_READY : SAVE_IDLE}
        >
          {busy ? "Guardando…" : event ? "Guardar cambios" : "Crear pase"}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 min-h-11 px-3"
          >
            Cancelar
          </button>
        ) : null}
      </div>
    </div>
  );
}
