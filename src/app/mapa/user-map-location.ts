export type UserMapLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  /** Degrees clockwise from true north (Geolocation coords.heading). */
  heading?: number | null;
};
