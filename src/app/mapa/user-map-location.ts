export type UserMapLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  /** m/s from Geolocation coords.speed; used to ignore noisy GPS heading when still. */
  speed?: number | null;
  /** Degrees clockwise from true north (Geolocation coords.heading). */
  heading?: number | null;
};
