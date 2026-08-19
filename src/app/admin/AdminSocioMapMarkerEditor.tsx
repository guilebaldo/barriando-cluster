"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { updateCatalogSocioMapMarker } from "./actions";
import { playCuelume } from "./useAdminCuelume";

const LeafletLocationPicker = dynamic(() => import("@/app/panel/LeafletLocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-56 rounded-xl border border-slate-200 bg-slate-100 animate-pulse" />
  ),
});

const SAVE_IDLE =
  "inline-flex items-center gap-1.5 bg-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-lg cursor-not-allowed";
const SAVE_READY =
  "inline-flex items-center gap-1.5 bg-[#27366D] hover:bg-[#1e2b58] text-white font-bold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-lg transition active:scale-[0.98]";

export default function AdminSocioMapMarkerEditor({
  socioId,
  initialLatitude,
  initialLongitude,
  onMessage,
}: {
  socioId: number;
  initialLatitude: number | null;
  initialLongitude: number | null;
  onMessage?: (text: string) => void;
}) {
  const router = useRouter();
  const [latitude, setLatitude] = useState<number | null>(initialLatitude);
  const [longitude, setLongitude] = useState<number | null>(initialLongitude);
  const [baseline, setBaseline] = useState({
    latitude: initialLatitude,
    longitude: initialLongitude,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLatitude(initialLatitude);
    setLongitude(initialLongitude);
    setBaseline({ latitude: initialLatitude, longitude: initialLongitude });
  }, [socioId, initialLatitude, initialLongitude]);

  const dirty =
    latitude !== baseline.latitude || longitude !== baseline.longitude;
  const canSave =
    dirty && latitude != null && longitude != null && !saving;

  async function handleSave() {
    if (!canSave || latitude == null || longitude == null) return;
    setSaving(true);
    const result = await updateCatalogSocioMapMarker({
      socioId,
      latitude,
      longitude,
    });
    setSaving(false);
    if (!result.ok) {
      playCuelume("error");
      onMessage?.(result.error);
      return;
    }
    playCuelume("success");
    setBaseline({ latitude, longitude });
    onMessage?.("Marcador guardado en el mapa.");
    router.refresh();
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/90 p-4 space-y-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          Marcador del mapa
        </p>
        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
          Mapa OpenStreetMap (no usa tu cuenta de Google). Mueve el pin y guarda; no necesitas
          cuenta vinculada ni llenar el resto del perfil.
        </p>
      </div>
      <LeafletLocationPicker
        latitude={latitude}
        longitude={longitude}
        disabled={saving}
        autoGeolocate={false}
        scrollWheelZoom
        hint="Clic en el mapa o arrastra el pin. También puedes usar la rueda del mouse."
        onChange={(lat, lng) => {
          setLatitude(lat);
          setLongitude(lng);
        }}
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!canSave}
          onClick={() => void handleSave()}
          data-cuelume-press=""
          data-cuelume-release=""
          className={canSave ? SAVE_READY : SAVE_IDLE}
        >
          {saving ? "Guardando…" : "Guardar marcador"}
        </button>
        {dirty && !saving ? (
          <span className="text-[10px] text-amber-700">Pin sin guardar</span>
        ) : null}
      </div>
    </section>
  );
}
