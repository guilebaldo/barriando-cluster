"use client";

import { useEffect, useRef } from "react";
import { loadGooglePlacesApi } from "@/lib/google-maps-loader";

export type ParsedBillingAddress = {
  billingStreet: string;
  billingColonia: string;
  billingCiudad: string;
  billingEstado: string;
  billingPais: string;
  billingCodigoPostal: string;
  billingAddressFull: string;
};

function parseAddressComponents(
  components: google.maps.GeocoderAddressComponent[] | undefined,
  formatted: string
): ParsedBillingAddress {
  try {
    const safeComponents = Array.isArray(components) ? components : [];

    const get = (type: string, useShort = false) => {
      const c = safeComponents.find(
        (part) => Array.isArray(part?.types) && part.types.includes(type)
      );
      return (useShort ? c?.short_name : c?.long_name) ?? "";
    };

    const route = get("route");
    const streetNumber = get("street_number");
    const street = [route, streetNumber].filter(Boolean).join(" ").trim();

    return {
      billingStreet: street || formatted.split(",")[0]?.trim() || "",
      billingColonia:
        get("sublocality") ||
        get("sublocality_level_1") ||
        get("neighborhood") ||
        get("political"),
      billingCiudad: get("locality") || get("administrative_area_level_2"),
      billingEstado: get("administrative_area_level_1"),
      billingPais: get("country"),
      billingCodigoPostal: get("postal_code"),
      billingAddressFull: formatted,
    };
  } catch (err) {
    console.warn("[places] parseAddressComponents failed:", err);
    return {
      billingStreet: formatted.split(",")[0]?.trim() || "",
      billingColonia: "",
      billingCiudad: "",
      billingEstado: "",
      billingPais: "",
      billingCodigoPostal: "",
      billingAddressFull: formatted,
    };
  }
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

interface BillingPlacesAutocompleteProps {
  onAddressSelected: (parsed: ParsedBillingAddress) => void;
  disabled?: boolean;
  className?: string;
}

export default function BillingPlacesAutocomplete({
  onAddressSelected,
  disabled,
  className,
}: BillingPlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onSelectRef = useRef(onAddressSelected);
  onSelectRef.current = onAddressSelected;

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
          fields: ["address_components", "formatted_address"],
          types: ["address"],
        });

        autocomplete.addListener("place_changed", () => {
          try {
            const place = autocomplete?.getPlace();
            const formatted = place?.formatted_address?.trim();
            if (!formatted) return;
            onSelectRef.current(parseAddressComponents(place?.address_components, formatted));
          } catch (err) {
            console.warn("[places] place_changed handler failed:", err);
          }
        });
      })
      .catch((err) => console.error("[places] autocomplete failed:", err));

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
      disabled={disabled}
      placeholder="Escribe y selecciona tu dirección fiscal..."
      className={className}
      autoComplete="off"
    />
  );
}
