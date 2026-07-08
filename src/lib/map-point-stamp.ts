import { listaSocios, type Socio } from "@/app/data/socios";
import { restaurantSlug } from "@/lib/pasaporte";
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
    return `/pasaporte/sellar?restaurante=${encodeURIComponent(restaurantSlug(socio))}`;
  }
  return null;
}

export function pointHasScannableStamp(point: MapRoutePoint): boolean {
  return getPointStampHref(point) != null;
}

export function getStampDisplayInfo(point: MapRoutePoint): StampDisplayInfo | null {
  const socio = getLinkedSocio(point);
  if (!socio || socio.categoria !== "Alimentos y Bebidas") return null;

  return {
    kind: "seasonal_nogada",
    title: "Edición especial de temporada",
    subtitle: "Chiles en Nogada",
    businessName: socio.name,
    logoSrc: `/logos/${socio.foto}.png`,
  };
}

export function pointShowsSeasonalStamp(point: MapRoutePoint): boolean {
  return getStampDisplayInfo(point) != null;
}

/** Contenido del popup del marcador (sin flechas; sello especial o mensaje patrimonial). */
export function buildMapMarkerPopupContent(point: MapRoutePoint): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "text-xs min-w-[11rem] max-w-[15rem] animate-popup-in";

  const title = document.createElement("p");
  title.className = "font-bold text-slate-900 leading-snug";
  title.textContent = point.name;
  wrapper.appendChild(title);

  const stamp = getStampDisplayInfo(point);

  if (stamp) {
    const badge = document.createElement("p");
    badge.className = "text-[10px] font-bold uppercase tracking-wider text-amber-700 mt-1.5";
    badge.textContent = stamp.title;
    wrapper.appendChild(badge);

    const stampVisual = document.createElement("div");
    stampVisual.className = "mt-2 flex flex-col items-center";
    stampVisual.innerHTML = `
      <div style="
        width:88px;height:88px;border-radius:50%;
        background:linear-gradient(145deg,#fbbf24 0%,#f59e0b 45%,#d97706 100%);
        border:3px solid #92400e;
        box-shadow:0 4px 14px rgba(180,120,20,0.35);
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        padding:8px;transform:rotate(-6deg);
        animation:float-y 3.5s ease-in-out infinite;
      ">
        <img src="${stamp.logoSrc}" alt="" style="width:36px;height:36px;object-fit:contain;margin-bottom:4px;" onerror="this.style.display='none'" />
        <span style="font-size:7px;font-weight:800;color:#422006;text-transform:uppercase;letter-spacing:0.04em;line-height:1.2;text-align:center;">Temporada</span>
        <span style="font-size:8px;font-weight:900;color:#1c1917;line-height:1.1;text-align:center;margin-top:2px;">${stamp.subtitle}</span>
      </div>
    `;
    wrapper.appendChild(stampVisual);

    const hint = document.createElement("p");
    hint.className = "text-[10px] text-slate-600 mt-2 leading-relaxed text-center";
    hint.textContent = "Escanea el QR en el local para recibir este sello dorado en tu Pasaporte.";
    wrapper.appendChild(hint);
  } else {
    if (point.category) {
      const category = document.createElement("p");
      category.className = "text-slate-500 mt-1";
      category.textContent = point.category;
      wrapper.appendChild(category);
    }

    const hint = document.createElement("p");
    hint.className = "text-[10px] text-slate-500 mt-3 leading-relaxed";
    hint.textContent = "Hito del MAP. Usa la ficha inferior para avanzar en tu recorrido.";
    wrapper.appendChild(hint);
  }

  return wrapper;
}
