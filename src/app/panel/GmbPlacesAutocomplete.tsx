"use client";

import { useEffect, useRef } from "react";
import { loadGooglePlacesApi } from "@/lib/google-maps-loader";

export type ParsedGmbPlace = {
  googleBusinessUrl: string;
  label: string;
};

function buildGmbUrl(place: google.maps.places.PlaceResult): string | null {
  const direct = place.url?.trim();
  if (direct) return direct;

  const placeId = place.place_id?.trim();
  if (placeId) {
    return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
  }

  const coords = place.geometry?.location;
  const name = place.name?.trim();
  if (coords && name) {
    const lat = coords.lat();
    const lng = coords.lng();
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=${placeId ?? ""}&center=${lat},${lng}`;
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

interface GmbPlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected: (parsed: ParsedGmbPlace) => void;
  disabled?: boolean;
  className?: string;
}

export default function GmbPlacesAutocomplete({
  value,
  onChange,
  onPlaceSelected,
  disabled,
  className,
}: GmbPlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onSelectRef = useRef(onPlaceSelected);
  onSelectRef.current = onPlaceSelected;

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
          fields: ["name", "formatted_address", "place_id", "url", "geometry"],
          types: ["establishment"],
        });

        autocomplete.addListener("place_changed", () => {
          try {
            const place = autocomplete?.getPlace();
            const gmbUrl = place ? buildGmbUrl(place) : null;
            if (!gmbUrl) return;
            const label =
              place?.name?.trim() ||
              place?.formatted_address?.trim() ||
              gmbUrl;
            onChange(label);
            onSelectRef.current({ googleBusinessUrl: gmbUrl, label });
          } catch (err) {
            console.warn("[places] gmb place_changed failed:", err);
          }
        });
      })
      .catch((err) => console.error("[places] gmb autocomplete failed:", err));

    return () => {
      cancelled = true;
      if (autocomplete && googleApi?.maps?.event) {
        googleApi.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, [disabled, onChange]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder="Busca tu negocio en Google..."
      className={className}
      autoComplete="off"
    />
  );
}
