import { analyzeFullStack } from '../engine/analyzer.js';
import { inspectDnsInfrastructure } from '../engine/dns-inspector.js';

/**
 * DeepStack Background Service Worker (Manifest V3)
 * - Captures main_frame and subresource HTTP headers & URLs via chrome.webRequest
 * - Reads HttpOnly & standard cookies via chrome.cookies
 * - Dynamically injects probes into pre-existing tabs when needed
 * - Runs the DeepStack analyzer and updates the toolbar badge count
 */

const MAX_TAB_CACHE_ENTRIES = 60;
const tabNetworkStore = new Map();
const tabReportCache = new Map();

function enforceMapLimit(map, limit = MAX_TAB_CACHE_ENTRIES) {
  while (map.size > limit) {
    const oldestKey = map.keys().next().value;
    if (oldestKey === undefined) break;
    map.delete(oldestKey);
  }
}

function getOrCreateTabEntry(tabId) {
  if (!tabNetworkStore.has(tabId)) {
    tabNetworkStore.set(tabId, {
      url: null,
      mainHeaders: Object.create(null),
      subHeaders: Object.create(null),
      observedUrls: new Set(),
      updatedAt: Date.now()
    });
    enforceMapLimit(tabNetworkStore);
  }
  return tabNetworkStore.get(tabId);
}

// 1. Intercept HTTP Response Headers via webRequest
function setupWebRequestListener() {
  const filter = { urls: ['http://*/*', 'https://*/*'] };
  const handleHeaders = (details) => {
    if (details.tabId < 0) return;
    const entry = getOrCreateTabEntry(details.tabId);

    if (details.type === 'main_frame') {
      tabReportCache.delete(details.tabId);
      entry.url = details.url;
      entry.mainHeaders = Object.create(null);
      entry.subHeaders = Object.create(null);
      entry.observedUrls = new Set();
      entry.updatedAt = Date.now();

      for (const h of details.responseHeaders || []) {
        if (h.name && h.value !== undefined) {
          const lk = h.name.toLowerCase();
          if (lk !== '__proto__' && lk !== 'constructor' && lk !== 'prototype') {
            entry.mainHeaders[lk] = h.value;
          }
        }
      }
    } else {
      if (entry.observedUrls.size < 250 && details.url) {
        entry.observedUrls.add(details.url);
      }
      const interestingSubHeaders = new Set([
        'x-powered-by',
        'server',
        'cf-ray',
        'x-vercel-id',
        'x-amz-cf-id',
        'x-fastly-request-id',
        'x-drupal-cache',
        'x-nextjs-cache'
      ]);
      for (const h of details.responseHeaders || []) {
        const lower = (h.name || '').toLowerCase();
        if (interestingSubHeaders.has(lower) && h.value && !entry.mainHeaders[lower]) {
          entry.subHeaders[lower] = h.value;
        }
      }
    }
  };

  try {
    chrome.webRequest.onHeadersReceived.addListener(
      handleHeaders,
      filter,
      ['responseHeaders', 'extraHeaders']
    );
  } catch {
    chrome.webRequest.onHeadersReceived.addListener(
      handleHeaders,
      filter,
      ['responseHeaders']
    );
  }
}

setupWebRequestListener();

// Clean up closed or navigating tabs
chrome.tabs.onRemoved.addListener((tabId) => {
  tabNetworkStore.delete(tabId);
  tabReportCache.delete(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    tabReportCache.delete(tabId);
  }
});

async function fetchFallbackHeaders(url) {
  const headers = Object.create(null);
  if (!url || !url.startsWith('http')) return headers;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1000);
  try {
    const resp = await fetch(url, {
      method: 'HEAD',
      cache: 'no-store',
      credentials: 'omit',
      signal: controller.signal
    });
    clearTimeout(timer);
    resp.headers.forEach((value, key) => {
      const lk = key.toLowerCase();
      if (lk !== '__proto__' && lk !== 'constructor' && lk !== 'prototype') {
        headers[lk] = value;
      }
    });
  } catch {
    clearTimeout(timer);
    // Fallback HEAD fetch may be blocked by CORS or network; safe to ignore
  }
  return headers;
}

async function getCookiesForUrl(url) {
  if (!url || !url.startsWith('http')) return [];
  try {
    return await chrome.cookies.getAll({ url });
  } catch {
    return [];
  }
}

async function requestSnapshotFromTab(tabId) {
  // First attempt: send message to existing content script
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: 'DEEPSTACK_COLLECT_PAGE' });
    if (response && response.ok && response.snapshot) {
      return response.snapshot;
    }
  } catch {
    // Content script not injected yet (e.g. tab was open before extension load)
  }

  // Second attempt: dynamically inject MAIN and ISOLATED scripts via chrome.scripting
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['src/content/main-world-probe.js'],
      world: 'MAIN'
    });
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['src/content/isolated-collector.js'],
      world: 'ISOLATED'
    });

    const response = await chrome.tabs.sendMessage(tabId, { type: 'DEEPSTACK_COLLECT_PAGE' });
    if (response && response.ok && response.snapshot) {
      return response.snapshot;
    }
  } catch (err) {
    throw new Error(`Cannot inspect this page (${err.message || 'restricted browser URL'}).`);
  }

  throw new Error('Failed to collect page snapshot.');
}

function updateBadge(tabId, count) {
  try {
    const text = count > 0 ? String(count) : '';
    chrome.action.setBadgeText({ tabId, text });
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#27272a' });
    if (chrome.action.setBadgeTextColor) {
      chrome.action.setBadgeTextColor({ tabId, color: '#fafafa' });
    }
  } catch {}
}

async function buildFullReportForTab(tabId, providedSnapshot = null) {
  const snapshot = providedSnapshot || (await requestSnapshotFromTab(tabId));
  const netEntry = getOrCreateTabEntry(tabId);

  const needsFallbackHeaders = Object.keys(netEntry.mainHeaders).length === 0 && Boolean(snapshot.url);

  const [fallbackHeaders, cookies, dnsInfo] = await Promise.all([
    needsFallbackHeaders ? fetchFallbackHeaders(snapshot.url) : Promise.resolve(null),
    getCookiesForUrl(snapshot.url),
    inspectDnsInfrastructure(snapshot.hostname)
  ]);

  const mergedHeaders = {
    ...(fallbackHeaders || {}),
    ...netEntry.subHeaders,
    ...netEntry.mainHeaders
  };

  const observedUrls = Array.from(netEntry.observedUrls);

  const report = analyzeFullStack({
    snapshot,
    headers: mergedHeaders,
    cookies,
    observedUrls,
    dnsInfo
  });

  tabReportCache.set(tabId, report);
  enforceMapLimit(tabReportCache);
  updateBadge(tabId, report.totalDetected);
  return report;
}

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || (sender.id && sender.id !== chrome.runtime.id)) return;

  // Automatic push from content script on page load
  if (message.type === 'DEEPSTACK_PAGE_SNAPSHOT' && sender.tab && sender.tab.id !== undefined) {
    buildFullReportForTab(sender.tab.id, message.snapshot)
      .then((report) => sendResponse({ ok: true, totalDetected: report.totalDetected }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }

  // On-demand request from Popup UI
  if (message.type === 'DEEPSTACK_INSPECT_TAB') {
    const tabId = message.tabId;
    const tabUrl = message.tabUrl || null;
    const forceRefresh = Boolean(message.forceRefresh);

    if (!forceRefresh && tabReportCache.has(tabId)) {
      const cached = tabReportCache.get(tabId);
      // Use cache if younger than 10 seconds AND matches the active tab URL
      if (Date.now() - cached.analyzedAt < 10000 && (!tabUrl || cached.url === tabUrl)) {
        sendResponse({ ok: true, report: cached });
        return false;
      }
    }

    buildFullReportForTab(tabId)
      .then((report) => sendResponse({ ok: true, report }))
      .catch((err) => sendResponse({ ok: false, error: err.message || String(err) }));
    return true;
  }
});
