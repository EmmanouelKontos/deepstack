/**
 * Per-tab network capture.
 *
 * MV3 service workers are suspended after ~30s of inactivity, which wipes
 * in-memory state. Captured response headers and subresource URLs are
 * therefore mirrored to chrome.storage.session so the popup still sees them
 * when it is opened long after the page finished loading.
 *
 * Privacy: Set-Cookie values are never stored, only cookie names.
 */

const KEY_PREFIX = 'tab:';
const MAX_OBSERVED_URLS = 300;
const MAX_URL_LENGTH = 400;
const MAX_HEADER_LENGTH = 2000;
const PERSIST_DELAY_MS = 750;
const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

// Subresource headers worth keeping when the document itself doesn't send them
const INTERESTING_SUB_HEADERS = new Set([
  'x-powered-by',
  'server',
  'cf-ray',
  'x-vercel-id',
  'x-amz-cf-id',
  'x-fastly-request-id',
  'x-drupal-cache',
  'x-nextjs-cache'
]);

const MAX_PRERENDERS_PER_TAB = 4;

const memory = new Map();
const prerenders = new Map();
const loading = new Map();
const persistTimers = new Map();

const storageKey = (tabId) => `${KEY_PREFIX}${tabId}`;

function emptyEntry(url = null) {
  return {
    url,
    mainHeaders: {},
    subHeaders: {},
    setCookieNames: new Set(),
    observed: new Set(),
    updatedAt: Date.now()
  };
}

function serialize(entry) {
  return {
    url: entry.url,
    mainHeaders: entry.mainHeaders,
    subHeaders: entry.subHeaders,
    setCookieNames: Array.from(entry.setCookieNames),
    observedUrls: Array.from(entry.observed),
    updatedAt: entry.updatedAt
  };
}

function revive(raw) {
  const entry = emptyEntry(typeof raw?.url === 'string' ? raw.url : null);
  if (raw && typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw.mainHeaders || {})) setSafe(entry.mainHeaders, k, v);
    for (const [k, v] of Object.entries(raw.subHeaders || {})) setSafe(entry.subHeaders, k, v);
    for (const n of raw.setCookieNames || []) entry.setCookieNames.add(String(n));
    for (const u of raw.observedUrls || []) entry.observed.add(String(u));
    entry.updatedAt = Number(raw.updatedAt) || Date.now();
  }
  return entry;
}

function setSafe(target, key, value) {
  const lk = String(key).toLowerCase();
  if (!lk || BLOCKED_KEYS.has(lk)) return;
  target[lk] = String(value).slice(0, MAX_HEADER_LENGTH);
}

function cookieName(setCookieValue) {
  const eq = setCookieValue.indexOf('=');
  return (eq > 0 ? setCookieValue.slice(0, eq) : setCookieValue).trim().slice(0, 80);
}

function schedulePersist(tabId, delay = PERSIST_DELAY_MS) {
  if (persistTimers.has(tabId)) return;
  const timer = setTimeout(() => {
    persistTimers.delete(tabId);
    const entry = memory.get(tabId);
    if (!entry) return;
    chrome.storage.session.set({ [storageKey(tabId)]: serialize(entry) }).catch(() => {});
  }, delay);
  persistTimers.set(tabId, timer);
}

async function hydrate(tabId) {
  let stored = null;
  try {
    const key = storageKey(tabId);
    stored = (await chrome.storage.session.get(key))[key] || null;
  } catch {
    // storage.session unavailable; fall back to a fresh entry
  }
  // A main_frame response may have landed while we were reading storage
  const existing = memory.get(tabId);
  const entry = existing || (stored ? revive(stored) : emptyEntry());
  memory.set(tabId, entry);
  loading.delete(tabId);
  return entry;
}

/** Resolves the entry for a tab, rehydrating from session storage after a worker restart. */
export function getTabEntry(tabId) {
  const entry = memory.get(tabId);
  if (entry) return Promise.resolve(entry);
  if (!loading.has(tabId)) loading.set(tabId, hydrate(tabId));
  return loading.get(tabId);
}

/** webRequest.onHeadersReceived handler. */
export function captureResponse(details) {
  if (details.tabId < 0) return;
  if (details.documentLifecycle === 'prerender') {
    capturePrerender(details);
    return;
  }

  if (details.type === 'main_frame') {
    const entry = emptyEntry(details.url);
    for (const h of details.responseHeaders || []) {
      if (!h.name || h.value === undefined) continue;
      if (h.name.toLowerCase() === 'set-cookie') {
        entry.setCookieNames.add(cookieName(h.value));
      } else {
        setSafe(entry.mainHeaders, h.name, h.value);
      }
    }
    memory.set(details.tabId, entry);
    schedulePersist(details.tabId, 0);
    return;
  }

  getTabEntry(details.tabId).then((entry) => {
    let changed = false;
    const url = details.url ? details.url.slice(0, MAX_URL_LENGTH) : null;
    if (url && entry.observed.size < MAX_OBSERVED_URLS && !entry.observed.has(url)) {
      entry.observed.add(url);
      changed = true;
    }
    for (const h of details.responseHeaders || []) {
      const lk = (h.name || '').toLowerCase();
      if (INTERESTING_SUB_HEADERS.has(lk) && h.value && !entry.mainHeaders[lk] && !entry.subHeaders[lk]) {
        setSafe(entry.subHeaders, lk, h.value);
        changed = true;
      }
    }
    if (changed) {
      entry.updatedAt = Date.now();
      schedulePersist(details.tabId);
    }
  });
}

/** Merged header map for analysis. Set-Cookie is reduced to cookie names. */
export function buildHeaderMap(entry, fallbackHeaders = null) {
  const merged = { ...(fallbackHeaders || {}), ...entry.subHeaders, ...entry.mainHeaders };
  if (entry.setCookieNames.size > 0) {
    merged['set-cookie'] = `${Array.from(entry.setCookieNames).join(', ')} (values hidden)`;
  }
  return merged;
}

/**
 * Prerendered documents (Speculation Rules) load inside the same tab before the user navigates.
 * Their responses are kept aside, keyed by documentId, so they never overwrite the page being viewed.
 * Activation fires no new request, so the popup looks them up by URL instead.
 */
function capturePrerender(details) {
  let docs = prerenders.get(details.tabId);
  if (!docs) prerenders.set(details.tabId, (docs = new Map()));
  if (details.type === 'main_frame') {
    const entry = emptyEntry(details.url);
    for (const h of details.responseHeaders || []) {
      if (!h.name || h.value === undefined) continue;
      if (h.name.toLowerCase() === 'set-cookie') entry.setCookieNames.add(cookieName(h.value));
      else setSafe(entry.mainHeaders, h.name, h.value);
    }
    docs.set(details.documentId, entry);
    while (docs.size > MAX_PRERENDERS_PER_TAB) docs.delete(docs.keys().next().value);
    return;
  }
  const entry = docs.get(details.documentId);
  if (entry && details.url && entry.observed.size < MAX_OBSERVED_URLS) entry.observed.add(details.url.slice(0, MAX_URL_LENGTH));
}

/** Entry for what the tab is showing now: the captured page, or a prerender that has since been activated. */
export async function getTabEntryForUrl(tabId, pageUrl) {
  const entry = await getTabEntry(tabId);
  if (!pageUrl || entry.url === pageUrl) return entry;
  for (const [docId, pre] of prerenders.get(tabId) || []) {
    if (pre.url === pageUrl) {
      prerenders.get(tabId).delete(docId);
      memory.set(tabId, pre);
      schedulePersist(tabId, 0);
      return pre;
    }
  }
  return entry;
}

export function forgetTab(tabId) {
  prerenders.delete(tabId);
  memory.delete(tabId);
  loading.delete(tabId);
  clearTimeout(persistTimers.get(tabId));
  persistTimers.delete(tabId);
  chrome.storage.session.remove(storageKey(tabId)).catch(() => {});
}
