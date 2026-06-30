"use client";

import { useEffect, useRef } from "react";
import { loadGooglePlacesApi } from "@/lib/google-maps-loader";

export type ParsedBusinessLocation = {
  address: string;
  latitude: number | null;
  longitude: number | null;
  mapsUrl: string | null;
};

function buildMapsUrl(place: google.maps.places.PlaceResult): string | null {
  const direct = place.url?.trim();
  if (direct) return direct;
  const placeId = place.place_id?.trim();
  if (placeId) return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
  const loc = place.geometry?.location;
  const name = place.name?.trim() || place.formatted_address?.trim();
  if (loc && name) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=${placeId ?? ""}`;
  }
  return null;
}

function waitForPlacesLibrary(google: typeof globalThis.google, timeoutMs = 10_000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (google.maps.places?.Autocomplete) {
      resolve();
      return;
    }
    const started = Date.now();
    const tick = () => {
      if (google.maps.places?.Autocomplete) {
        resolve();
        return;
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error("Google Places no disponible tras cargar Maps"));
        return;
      }
      window.setTimeout(tick, 40);
    };
    tick();
  });
}

interface BusinessPlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onLocationSelected: (parsed: ParsedBusinessLocation) => void;
  disabled?: boolean;
  className?: string;
}

export default function BusinessPlacesAutocomplete({
  value,
  onChange,
  onLocationSelected,
  disabled,
  className,
}: BusinessPlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onSelectRef = useRef(onLocationSelected);
  onSelectRef.current = onLocationSelected;

  useEffect(() => {
    if (disabled || !inputRef.current) return;

    let autocomplete: google.maps.places.Autocomplete | null = null;
    let googleApi: typeof google | null = null;
    let cancelled = false;

    loadGooglePlacesApi()
      .then(async (google) => {
        if (cancelled || !inputRef.current) return;
        googleApi = google;
        await waitForPlacesLibrary(google);
        if (cancelled || !inputRef.current) return;

        autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "mx" },
          fields: ["formatted_address", "geometry", "name", "place_id", "url"],
          types: ["establishment", "geocode"],
        });

        autocomplete.addListener("place_changed", () => {
          try {
            const place = autocomplete?.getPlace();
            const formatted = place?.formatted_address?.trim() || place?.name?.trim();
            if (!formatted) return;
            const lat = place?.geometry?.location?.lat() ?? null;
            const lng = place?.geometry?.location?.lng() ?? null;
            onSelectRef.current({
              address: formatted,
              latitude: lat,
              longitude: lng,
              mapsUrl: place ? buildMapsUrl(place) : null,
            });
          } catch (err) {
            console.warn("[places] business place_changed failed:", err);
          }
        });
      })
      .catch((err) => console.error("[places] business autocomplete failed:", err));

    return () => {
      cancelled = true;
      if (autocomplete && googleApi?.maps?.event) {
        googleApi.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, [disabled]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder="Busca la ubicación exacta de tu negocio..."
      className={className}
      autoComplete="off"
    />
  );
}
