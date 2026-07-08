import { loadGoogleMapsApi } from "@/lib/google-maps-loader";

export type LatLngPoint = { latitude: number; longitude: number };

function mergeSegments(segments: Array<Array<[number, number]>>): Array<[number, number]> {
  const merged: Array<[number, number]> = [];
  for (const segment of segments) {
    if (segment.length === 0) continue;
    if (merged.length === 0) {
      merged.push(...segment);
      continue;
    }
    const last = merged[merged.length - 1];
    const startIdx =
      last[0] === segment[0][0] && last[1] === segment[0][1] ? 1 : 0;
    merged.push(...segment.slice(startIdx));
  }
  return merged;
}

function pathFromDirectionsLegs(
  legs: google.maps.DirectionsLeg[] | undefined
): Array<[number, number]> {
  const path: Array<[number, number]> = [];
  for (const leg of legs ?? []) {
    for (const step of leg.steps ?? []) {
      for (const pt of step.path ?? []) {
        const lat = pt.lat();
        const lng = pt.lng();
        const last = path[path.length - 1];
        if (!last || last[0] !== lat || last[1] !== lng) {
          path.push([lat, lng]);
        }
      }
    }
  }
  return path;
}

async function fetchWalkingSegment(
  service: google.maps.DirectionsService,
  travelMode: google.maps.TravelMode,
  from: LatLngPoint,
  to: LatLngPoint
): Promise<Array<[number, number]>> {
  const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
    service.route(
      {
        origin: { lat: from.latitude, lng: from.longitude },
        destination: { lat: to.latitude, lng: to.longitude },
        travelMode,
      },
      (res, status) => {
        if (status === google.maps.DirectionsStatus.OK && res) resolve(res);
        else reject(new Error(String(status)));
      }
    );
  });

  const path = pathFromDirectionsLegs(result.routes[0]?.legs);
  if (path.length > 0) return path;

  return [
    [from.latitude, from.longitude],
    [to.latitude, to.longitude],
  ];
}

/** Trazo peatonal real entre paradas, tramo a tramo por calles transitables. */
export async function buildGoogleWalkingPath(
  points: LatLngPoint[]
): Promise<Array<[number, number]>> {
  if (points.length === 0) return [];
  if (points.length === 1) {
    return [[points[0].latitude, points[0].longitude]];
  }

  const google = await loadGoogleMapsApi();
  const service = new google.maps.DirectionsService();
  const travelMode = google.maps.TravelMode.WALKING;

  try {
    const segments: Array<Array<[number, number]>> = [];
    for (let i = 0; i < points.length - 1; i++) {
      segments.push(
        await fetchWalkingSegment(service, travelMode, points[i], points[i + 1])
      );
    }
    const merged = mergeSegments(segments);
    if (merged.length > 0) return merged;
  } catch {
    // fallback below
  }

  return points.map((p) => [p.latitude, p.longitude] as [number, number]);
}
