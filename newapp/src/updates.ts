// PathoNexa newapp — in-app Google Play Store update checks.
//
// The app fetches the latest published version from its own Google Play
// listing, compares it with the running app version and lets the UI offer
// "Update now" (opens the Play Store) or "Later". The check is Android-only
// (that is where the app is distributed) and fails completely silently —
// offline, dev builds and unpublished listings never produce an error.
import { Linking, Platform } from 'react-native';
import Constants from 'expo-constants';

/** Must match `expo.android.package` in app.json. */
export const PLAY_STORE_ID = 'com.pathonexa.newapp';
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${PLAY_STORE_ID}`;

export type UpdateCheck = {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
};

/** True when dotted version `a` (e.g. "1.2.10") is newer than `b` (e.g. "1.2"). */
export function isNewerVersion(a: string, b: string): boolean {
  const pa = a.split(/[.\-+_]/).map((part) => parseInt(part, 10));
  const pb = b.split(/[.\-+_]/).map((part) => parseInt(part, 10));
  const length = Math.max(pa.length, pb.length);
  for (let i = 0; i < length; i += 1) {
    const x = Number.isFinite(pa[i]) ? pa[i] : 0;
    const y = Number.isFinite(pb[i]) ? pb[i] : 0;
    if (x !== y) return x > y;
  }
  return false;
}

function fetchWithTimeout(url: string, ms: number): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal, headers: { 'user-agent': 'PathoNexa/1.0' } })
    .then((response) => {
      if (!response.ok) throw new Error(`Play Store responded ${response.status}`);
      return response.text();
    })
    .finally(() => clearTimeout(timer));
}

/** Reads the latest published version from the Play Store listing HTML. */
async function fetchLatestPlayVersion(): Promise<string | null> {
  const html = await fetchWithTimeout(`${PLAY_STORE_URL}&hl=en&gl=US`, 10000);
  const patterns = [
    /itemprop="softwareVersion"[^>]*content="([^"]+)"/,
    /content="([^"]+)"[^>]*itemprop="softwareVersion"/,
    /softwareVersion[^>]{0,200}?content="([^"]+)"/,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    const value = match?.[1]?.trim();
    if (value && /^\d+(\.\d+)*\S*$/.test(value)) return value;
  }
  return null;
}

/** Version currently running (from app.json via expo-constants). */
export function currentAppVersion(): string {
  return Constants.expoConfig?.version ?? '0.0.0';
}

/**
 * In-app Google Play Store update check.
 * Returns null when a check is not possible (not Android, offline, or the
 * listing does not expose a version) so callers can stay silent.
 */
export async function checkForPlayUpdates(): Promise<UpdateCheck | null> {
  if (Platform.OS !== 'android') return null;
  const currentVersion = currentAppVersion();
  let latestVersion: string | null = null;
  try {
    latestVersion = await fetchLatestPlayVersion();
  } catch {
    return null;
  }
  if (!latestVersion) return null;
  return {
    updateAvailable: isNewerVersion(latestVersion, currentVersion),
    currentVersion,
    latestVersion,
  };
}

/** Opens the PathoNexa Google Play listing (new tab on web, Play Store on Android). */
export async function openPlayStore(): Promise<void> {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(PLAY_STORE_URL, '_blank', 'noopener');
    return;
  }
  try {
    await Linking.openURL(PLAY_STORE_URL);
  } catch {
    // No browser / Play Store available — nothing else to do.
  }
}
