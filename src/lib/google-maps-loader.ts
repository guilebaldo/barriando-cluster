declare global {
  interface Window {
    google?: typeof google;
    __barriandoMapsCallback?: () => void;
  }
}

let loadPromise: Promise<typeof google> | null = null;

function getApiKey(): string {
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  const placesKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY?.trim();
  return mapsKey || placesKey || "";
}

function waitForGoogleMaps(timeoutMs = 15_000): Promise<typeof google> {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve(window.google);
      return;
    }
    const started = Date.now();
    const tick = () => {
      if (window.google?.maps) {
        resolve(window.google);
        return;
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error("Tiempo de espera agotado al cargar Google Maps"));
        return;
      }
      window.setTimeout(tick, 40);
    };
    tick();
  });
}

/**
 * Carga un único script de Maps JS (geometry + places).
 * No usar `loading=async` en la URL: deja `google.maps` indefinido tras onload.
 */
export function loadGoogleMapsApi(): Promise<typeof google> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps solo en cliente"));
  }
  if (window.google?.maps) {
    return Promise.resolve(window.google);
  }

  if (!loadPromise) {
    const key = getApiKey();
    if (!key) {
      return Promise.reject(new Error("Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"));
    }

    loadPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[src*="maps.googleapis.com/maps/api/js"]'
      );

      if (existing) {
        waitForGoogleMaps()
          .then(resolve)
          .catch(reject);
        return;
      }

      const callbackName = "__barriandoMapsInit";
      window.__barriandoMapsCallback = () => {
        delete window.__barriandoMapsCallback;
        if (window.google?.maps) {
          resolve(window.google);
        } else {
          reject(new Error("Google Maps no disponible tras callback"));
        }
      };

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=geometry,places&callback=__barriandoMapsCallback&v=weekly`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        loadPromise = null;
        reject(
          new Error(
            "No se pudo descargar maps.googleapis.com. Revisa la clave, facturación y restricciones de dominio en Google Cloud."
          )
        );
      };
      document.head.appendChild(script);
    });
  }

  return loadPromise;
}

/** Alias: mismo script unificado (geometry + places). */
export const loadGooglePlacesApi = loadGoogleMapsApi;
