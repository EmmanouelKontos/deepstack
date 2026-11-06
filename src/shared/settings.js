/**
 * User preferences shared by the popup and the service worker.
 * Stored in chrome.storage.local so they sync across both contexts.
 */

const SETTINGS_KEY = 'settings';

export const DEFAULT_SETTINGS = Object.freeze({
  /** Look up public DNS records (CNAME, MX, TXT) via DNS-over-HTTPS when the popup opens. */
  dnsLookups: true
});

function normalize(raw) {
  const out = { ...DEFAULT_SETTINGS };
  if (raw && typeof raw === 'object') {
    if (typeof raw.dnsLookups === 'boolean') out.dnsLookups = raw.dnsLookups;
  }
  return out;
}

export async function getSettings() {
  try {
    const stored = await chrome.storage.local.get(SETTINGS_KEY);
    return normalize(stored[SETTINGS_KEY]);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function updateSettings(patch) {
  const next = normalize({ ...(await getSettings()), ...patch });
  await chrome.storage.local.set({ [SETTINGS_KEY]: next });
  return next;
}
