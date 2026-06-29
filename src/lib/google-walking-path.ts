import { loadGoogleMapsApi } from "@/lib/google-maps-loader";

export type LatLngPoint = { latitude: number; longitude: number };

/** Trazo peatonal real entre paradas con Google Directions (WALKING). */
export async function buildGoogleWalkingPath(
  points: LatLngPoint[]
): Promise<Array<[number, number]>> {
  if (points.length < 2) {
    return points.map((p) => [p.latitude, p.longitude] as [number, number]);
  }

  const google = await loadGoogleMapsApi();
  const service = new google.maps.DirectionsService();
  const path: Array<[number, number]> = [];

  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i];
    const to = points[i + 1];

    try {
      const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        service.route(
          {
            origin: { lat: from.latitude, lng: from.longitude },
            destination: { lat: to.latitude, lng: to.longitude },
            travelMode: google.maps.TravelMode.WALKING,
          },
          (res, status) => {
            if (status === google.maps.DirectionsStatus.OK && res) resolve(res);
            else reject(new Error(status));
          }
        );
      });

      const steps = result.routes[0]?.overview_path ?? [];
      for (const step of steps) {
        const lat = step.lat();
        const lng = step.lng();
        const last = path[path.length - 1];
        if (!last || last[0] !== lat || last[1] !== lng) {
          path.push([lat, lng]);
        }
      }
    } catch {
      path.push([from.latitude, from.longitude], [to.latitude, to.longitude]);
    }
  }

  if (path.length === 0) {
    return points.map((p) => [p.latitude, p.longitude] as [number, number]);
  }

  return path;
}
