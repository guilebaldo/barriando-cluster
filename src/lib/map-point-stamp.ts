import { listaSocios, type Socio } from "@/app/data/socios";
import type { MapRoutePoint } from "@/lib/map-route-client";

export type StampDisplayInfo = {
  kind: "seasonal_nogada";
  title: string;
  subtitle: string;
  businessName: string;
  logoSrc: string;
};

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function restaurantSlugFromName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getLinkedSocio(point: MapRoutePoint): Socio | null {
  if (point.socioId) {
    const socio = listaSocios.find((s) => s.id === point.socioId);
    if (socio) return socio;
  }

  return (
    listaSocios.find((s) => normalizeName(s.name) === normalizeName(point.name)) ?? null
  );
}

export function getPointStampHref(point: MapRoutePoint): string | null {
  const socio = getLinkedSocio(point);
  if (socio?.categoria === "Alimentos y Bebidas") {
    return `/pasaporte/sellar?restaurante=${encodeURIComponent(restaurantSlugFromName(socio.name))}`;
  }
  if (point.hasSeasonalStamp) {
    return `/pasaporte/sellar?restaurante=${encodeURIComponent(restaurantSlugFromName(point.name))}`;
  }
  return null;
}

export function pointHasScannableStamp(point: MapRoutePoint): boolean {
  return getPointStampHref(point) != null;
}

export function getStampDisplayInfo(point: MapRoutePoint): StampDisplayInfo | null {
  const socio = getLinkedSocio(point);
  if (socio?.categoria === "Alimentos y Bebidas") {
    return {
      kind: "seasonal_nogada",
      title: "Edición especial de temporada",
      subtitle: "Chiles en Nogada",
      businessName: socio.name,
      logoSrc: socio.logoUrl?.trim() || `/logos/${socio.foto}.png`,
    };
  }

  if (!point.hasSeasonalStamp) return null;

  return {
    kind: "seasonal_nogada",
    title: "Edición especial de temporada",
    subtitle: "Chiles en Nogada",
    businessName: point.name,
    logoSrc: point.stampLogoSrc?.trim() || `/logos/${restaurantSlugFromName(point.name)}.png`,
  };
}

export function pointShowsSeasonalStamp(point: MapRoutePoint): boolean {
  return getStampDisplayInfo(point) != null;
}

/** Contenido compacto del popup del marcador con sello escaneable. */
export function buildMapMarkerPopupContent(point: MapRoutePoint): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "text-[11px] max-w-[11rem] leading-snug animate-popup-in";

  const title = document.createElement("p");
  title.className = "font-bold text-slate-900 leading-tight pr-4";
  title.textContent = point.name;
  wrapper.appendChild(title);

  const stamp = getStampDisplayInfo(point);
  if (!stamp) return wrapper;

  const badge = document.createElement("p");
  badge.className = "text-[9px] font-bold uppercase tracking-wider text-amber-700 mt-1";
  badge.textContent = "Sello de temporada";
  wrapper.appendChild(badge);

  const row = document.createElement("div");
  row.className = "mt-1.5 flex items-center gap-2";
  row.innerHTML = `
    <div style="
      width:52px;height:52px;border-radius:50%;flex-shrink:0;
      background:linear-gradient(145deg,#fbbf24 0%,#f59e0b 55%,#d97706 100%);
      border:2px solid #92400e;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      padding:4px;
    ">
      <img src="${stamp.logoSrc}" alt="" style="width:22px;height:22px;object-fit:contain;" onerror="this.style.display='none'" />
      <span style="font-size:6px;font-weight:800;color:#422006;text-transform:uppercase;line-height:1;text-align:center;margin-top:2px;">Nogada</span>
    </div>
    <p style="font-size:10px;color:#475569;line-height:1.35;margin:0;">
      Escanea el QR en el local para sellar tu Pasaporte.
    </p>
  `;
  wrapper.appendChild(row);

  return wrapper;
}
