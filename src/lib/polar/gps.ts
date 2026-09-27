import type { GeoPos } from "./types";

/**
 * Real device GPS over the browser Geolocation API. In the field this is the
 * handset/terminal receiver; in a preview it resolves to the sandbox location.
 * High-accuracy mode, generous timeout, no caching.
 */
export function deviceFix(timeoutMs = 10_000): Promise<GeoPos & { accuracyM: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation unavailable on this device"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({
          lat: Math.round(p.coords.latitude * 10000) / 10000,
          lon: Math.round(p.coords.longitude * 10000) / 10000,
          accuracyM: Math.round(p.coords.accuracy),
        }),
      (err) =>
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? "Location permission denied"
              : err.code === err.TIMEOUT
                ? "GPS timeout — no fix in time"
                : "GPS fix unavailable",
          ),
        ),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 },
    );
  });
}

/**
 * Continuous device-GPS watch. Returns a stop function; calls onFix for every
 * receiver update. Used for live-tracking a beacon or the operator handset.
 */
export function deviceFixWatch(
  onFix: (pos: GeoPos & { accuracyM: number }) => void,
  onError?: (message: string) => void,
  timeoutMs = 15_000,
): () => void {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    onError?.("Geolocation unavailable on this device");
    return () => {};
  }
  const watchId = navigator.geolocation.watchPosition(
    (p) =>
      onFix({
        lat: Math.round(p.coords.latitude * 10000) / 10000,
        lon: Math.round(p.coords.longitude * 10000) / 10000,
        accuracyM: Math.round(p.coords.accuracy),
      }),
    (err) =>
      onError?.(
        err.code === err.PERMISSION_DENIED
          ? "Location permission denied"
          : err.code === err.TIMEOUT
            ? "GPS timeout — no fix in time"
            : "GPS fix unavailable",
      ),
    { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 5_000 },
  );
  return () => navigator.geolocation.clearWatch(watchId);
}
