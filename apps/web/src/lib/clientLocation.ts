const KEY = 'kerdos.clientLocation';

/**
 * Best-effort location capture (FR-11). If the browser supports geolocation and
 * the user grants permission, cache a coarse "lat,lng" so the audit trail can
 * record where a change was made. Silently does nothing if location services are
 * off or permission is denied — it is never required.
 */
export function captureClientLocation(): void {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        localStorage.setItem(KEY, `${latitude.toFixed(4)},${longitude.toFixed(4)}`);
      } catch {
        /* storage unavailable — ignore */
      }
    },
    () => {
      /* denied / unavailable — no location is recorded */
    },
    { maximumAge: 600_000, timeout: 8_000 },
  );
}

/** The cached coarse location ("lat,lng"), or null if never granted. */
export function getClientLocation(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
