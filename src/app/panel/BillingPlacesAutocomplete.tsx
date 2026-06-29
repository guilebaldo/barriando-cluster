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
  components: google.maps.GeocoderAddressComponent[],
  formatted: string
): ParsedBillingAddress {
  const get = (type: string, useShort = false) => {
    const c = components.find((part) => part.types.includes(type));
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

  useEffect(() => {
    if (disabled || !inputRef.current) return;
    let autocomplete: google.maps.places.Autocomplete | null = null;
    let cancelled = false;

    loadGooglePlacesApi()
      .then((google) => {
        if (cancelled || !inputRef.current) return;
        autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "mx" },
          fields: ["address_components", "formatted_address"],
        });
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete?.getPlace();
          if (!place?.address_components || !place.formatted_address) return;
          onAddressSelected(
            parseAddressComponents(place.address_components, place.formatted_address)
          );
        });
      })
      .catch((err) => console.error("[places] autocomplete failed:", err));

    return () => {
      cancelled = true;
      if (autocomplete) google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [disabled, onAddressSelected]);

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
