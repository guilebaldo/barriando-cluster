"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapRoutePoint } from "@/lib/map-route-client";
import { circuitViaWalkPath } from "@/lib/map-circuit";
import type { UserMapLocation } from "./user-map-location";
import MapMarkerPopup from "./MapMarkerPopup";
import { pointHasScannableStamp } from "@/lib/map-point-stamp";
import { quantizeHeading } from "./map-heading";
import { getMapFocusPanOffsetPx, leafletFlyToWithBottomBias, readCssPxVar } from "@/lib/map-focus-pan";

function makeUserLocationIcon(heading: number | null | undefined): L.DivIcon {
  const hasHeading = typeof heading === "number" && Number.isFinite(heading);
  const rotation = hasHeading ? heading : 0;
  const cone = hasHeading
    ? `<div style="
          position:absolute;left:50%;top:50%;width:64px;height:64px;
          transform:translate(-50%,-50%) rotate(${rotation}deg);
          pointer-events:none;
        ">
          <div style="
            position:absolute;left:50%;bottom:50%;width:52px;height:46px;
            transform:translateX(-50%);
            background:linear-gradient(to top, rgba(59,130,246,0.05) 0%, rgba(59,130,246,0.38) 70%, rgba(59,130,246,0.12) 100%);
            clip-path:polygon(50% 0%, 0% 100%, 100% 100%);
          "></div>
        </div>`
    : "";

  return L.divIcon({
    className: "user-location-marker",
    html: `<div style="position:relative;width:72px;height:72px;">
      ${cone}
      <div style="
        position:absolute;left:50%;top:50%;width:16px;height:16px;
        transform:translate(-50%,-50%);
        background:#3b82f6;border:3px solid #fff;border-radius:50%;
        box-shadow:0 1px 6px rgba(37,99,235,.45);
      "></div>
    </div>`,
    iconSize: [72, 72],
    iconAnchor: [36, 36],
  });
}

function FitRouteBounds({
  points,
  highlightedId,
}: {
  points: MapRoutePoint[];
  highlightedId: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (highlightedId || points.length === 0) return;
    const bounds = L.latLngBounds(points.map((p) => [p.latitude, p.longitude] as [number, number]));
    const safeTop = Math.max(48, Math.round(readCssPxVar("--safe-area-inset-top") + 24));
    map.fitBounds(bounds, {
      paddingTopLeft: [48, safeTop],
      paddingBottomRight: [48, 48],
      maxZoom: 16,
    });
  }, [map, points, highlightedId]);

  return null;
}

function FocusHighlightedPoint({
  points,
  highlightedId,
  bottomSheetHeight,
}: {
  points: MapRoutePoint[];
  highlightedId: string | null;
  bottomSheetHeight: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!highlightedId) return;
    const point = points.find((p) => p.id === highlightedId);
    if (!point) return;
    const hasStampPopup = pointHasScannableStamp(point);
    const offsetY = getMapFocusPanOffsetPx(bottomSheetHeight, hasStampPopup);
    leafletFlyToWithBottomBias(
      map,
      [point.latitude, point.longitude],
      17,
      offsetY,
      0.7
    );
  }, [map, points, highlightedId, bottomSheetHeight]);

  return null;
}

/** Keep the blue user dot in the visible map band above the ficha (same idea as Cuponera). */
function FollowUserLocation({
  userLocation,
  bottomSheetHeight,
  paused,
}: {
  userLocation: UserMapLocation | null;
  bottomSheetHeight: number;
  /** When focusing a hito, don't fight that camera. */
  paused: boolean;
}) {
  const map = useMap();
  const lastFocusRef = useRef<{ lat: number; lng: number; sheet: number } | null>(null);

  useEffect(() => {
    if (paused || !userLocation) return;

    const { latitude: lat, longitude: lng } = userLocation;
    const prev = lastFocusRef.current;
    const movedFar =
      !prev ||
      Math.hypot(lat - prev.lat, lng - prev.lng) > 0.00028; // ~30 m
    const sheetChanged = !prev || Math.abs(prev.sheet - bottomSheetHeight) > 24;
    if (!movedFar && !sheetChanged) return;

    lastFocusRef.current = { lat, lng, sheet: bottomSheetHeight };

    const offsetY =
      bottomSheetHeight > 0 ? Math.round(bottomSheetHeight * 0.5 + 20) : 0;

    const zoom = Math.max(map.getZoom(), 16);
    leafletFlyToWithBottomBias(map, [lat, lng], zoom, offsetY, prev ? 0.55 : 0.7);
  }, [map, userLocation, bottomSheetHeight, paused]);

  return null;
}

function makeIcon(kind: "start" | "milestone" | "premium", highlighted: boolean): L.DivIcon {
  const pulse = highlighted
    ? "box-shadow:0 0 0 6px rgba(251,191,36,.45),0 0 0 12px rgba(251,191,36,.2);"
    : "box-shadow:0 2px 6px rgba(0,0,0,.35);";

  if (kind === "start") {
    const size = highlighted ? 22 : 16;
    return L.divIcon({
      className: highlighted ? "map-marker-highlight" : "",
      html: `<div style="background:#fbbf24;width:${size}px;height:${size}px;border-radius:50%;border:3px solid #27366D;${pulse}transition:transform .2s ease"></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  if (kind === "premium") {
    const size = highlighted ? 20 : 14;
    return L.divIcon({
      className: highlighted ? "map-marker-highlight" : "",
      html: `<div style="background:#27366D;width:${size}px;height:${size}px;border-radius:50%;border:3px solid #fbbf24;${pulse}transition:transform .2s ease"></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  const size = highlighted ? 18 : 12;
  return L.divIcon({
    className: highlighted ? "map-marker-highlight" : "",
    html: `<div style="background:${highlighted ? "#27366D" : "#64748b"};width:${size}px;height:${size}px;border-radius:50%;border:2px solid ${highlighted ? "#fbbf24" : "#fff"};${pulse}transition:transform .2s ease"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function RouteMarker({
  point,
  highlighted,
  showStampPopups,
  onSelect,
}: {
  point: MapRoutePoint;
  highlighted: boolean;
  showStampPopups: boolean;
  onSelect?: (id: string) => void;
}) {
  const markerRef = useRef<L.Marker>(null);
  const kind =
    point.order === 1 ? "start" : point.kind === "premium_business" ? "premium" : "milestone";
  const icon = useMemo(() => makeIcon(kind, highlighted), [kind, highlighted]);

  const canStamp = pointHasScannableStamp(point);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    if (!showStampPopups || !highlighted || !canStamp) {
      marker.closePopup();
      return;
    }

    const timer = window.setTimeout(() => {
      marker.openPopup();
    }, 680);
    return () => window.clearTimeout(timer);
  }, [highlighted, canStamp, showStampPopups, point.id]);

  return (
    <>
      {highlighted && (
        <Circle
          center={[point.latitude, point.longitude]}
          radius={45}
          pathOptions={{
            color: "#fbbf24",
            fillColor: "#fbbf24",
            fillOpacity: 0.15,
            weight: 2,
            opacity: 0.85,
          }}
        />
      )}
      <Marker
        ref={markerRef}
        position={[point.latitude, point.longitude]}
        icon={icon}
        zIndexOffset={highlighted ? 500 : 0}
        eventHandlers={{
          click: () => onSelect?.(point.id),
        }}
      >
        {canStamp ? (
          <Popup>
            <MapMarkerPopup point={point} />
          </Popup>
        ) : null}
      </Marker>
    </>
  );
}

export default function MapRouteMap({
  points,
  walkPath,
  highlightedId = null,
  userLocation = null,
  onPointSelect,
  immersive = false,
  bottomSheetHeight = 0,
  showStampPopups = true,
}: {
  points: MapRoutePoint[];
  walkPath?: Array<[number, number]>;
  highlightedId?: string | null;
  userLocation?: UserMapLocation | null;
  onPointSelect?: (id: string) => void;
  immersive?: boolean;
  bottomSheetHeight?: number;
  /** False while welcome sheet is open — stamp popups wait until Comenzar recorrido. */
  showStampPopups?: boolean;
}) {
  const polyline = useMemo(() => {
    if (walkPath && walkPath.length >= 2) return walkPath;
    return circuitViaWalkPath();
  }, [walkPath]);

  const center = useMemo<[number, number]>(() => {
    if (points.length === 0) return [19.0414, -98.1984];
    const first = points[0];
    return [first.latitude, first.longitude];
  }, [points]);

  const displayHeading = quantizeHeading(userLocation?.heading, 5);
  const userIcon = useMemo(
    () => makeUserLocationIcon(displayHeading),
    [displayHeading]
  );

  if (points.length === 0) {
    return (
      <div className="h-[480px] rounded-2xl border border-slate-200 bg-slate-100 flex items-center justify-center text-sm text-slate-500">
        No hay puntos de ruta disponibles.
      </div>
    );
  }

  return (
    <div
      className={
        immersive
          ? "absolute inset-0 z-0 overflow-hidden"
          : "rounded-2xl overflow-hidden border border-slate-200 shadow-lg h-[min(70vh,520px)] relative z-0 isolate"
      }
    >
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom
        className="h-full w-full z-0"
        zoomControl={!immersive}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitRouteBounds points={points} highlightedId={highlightedId} />
        <FocusHighlightedPoint
          points={points}
          highlightedId={showStampPopups ? highlightedId : null}
          bottomSheetHeight={bottomSheetHeight}
        />
        <FollowUserLocation
          userLocation={userLocation ?? null}
          bottomSheetHeight={bottomSheetHeight}
          paused={Boolean(showStampPopups && highlightedId)}
        />
        <Polyline
          positions={polyline}
          pathOptions={{ color: "#27366D", weight: 4, opacity: 0.85, dashArray: "10 12" }}
        />
        {userLocation && (
          <>
            <Circle
              center={[userLocation.latitude, userLocation.longitude]}
              radius={userLocation.accuracy ?? 25}
              pathOptions={{
                color: "#3b82f6",
                fillColor: "#3b82f6",
                fillOpacity: 0.12,
                weight: 1,
              }}
            />
            <Marker
              position={[userLocation.latitude, userLocation.longitude]}
              icon={userIcon}
              zIndexOffset={1000}
              interactive={false}
            />
          </>
        )}
        {points.map((point) => (
          <RouteMarker
            key={point.id}
            point={point}
            highlighted={highlightedId === point.id}
            showStampPopups={showStampPopups}
            onSelect={onPointSelect}
          />
        ))}
      </MapContainer>
    </div>
  );
}
