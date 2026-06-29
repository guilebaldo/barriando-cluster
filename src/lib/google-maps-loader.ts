declare global {
  interface Window {
    google?: typeof google;
  }
}

let mapsLoadPromise: Promise<typeof google> | null = null;
let placesLoadPromise: Promise<typeof google> | null = null;

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`No se pudo cargar: ${src}`));
    document.head.appendChild(script);
  });
}

/** Mapa interactivo y Directions (WALKING). */
export async function loadGoogleMapsApi(): Promise<typeof google> {
  if (typeof window === "undefined") throw new Error("Google Maps solo en cliente");
  if (window.google?.maps) return window.google;

  if (!mapsLoadPromise) {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
    if (!key) throw new Error("Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");

    mapsLoadPromise = (async () => {
      await injectScript(
        `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=geometry&v=weekly&loading=async`
      );
      if (!window.google?.maps) throw new Error("Google Maps no disponible");
      return window.google;
    })();
  }

  return mapsLoadPromise;
}

/** Places API (New) — autocompletado de direcciones. */
export async function loadGooglePlacesApi(): Promise<typeof google> {
  if (typeof window === "undefined") throw new Error("Google Places solo en cliente");
  if (window.google?.maps?.places) return window.google;

  if (!placesLoadPromise) {
    const key = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY?.trim();
    if (!key) throw new Error("Falta NEXT_PUBLIC_GOOGLE_PLACES_API_KEY");

    placesLoadPromise = (async () => {
      await injectScript(
        `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&v=weekly&loading=async`
      );
      await loadGoogleMapsApi().catch(() => undefined);
      if (!window.google?.maps) throw new Error("Google Places no disponible");
      return window.google;
    })();
  }

  return placesLoadPromise;
}
