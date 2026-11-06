import { analyzeFullStack } from '../engine/analyzer.js';
import { inspectDnsInfrastructure } from '../engine/dns-inspector.js';
import { getSettings } from '../shared/settings.js';
import { buildHeaderMap, captureResponse, forgetTab, getTabEntryForUrl } from './tab-store.js';

/**
 * DeepStack background service worker (Manifest V3)
 * - Captures document + subresource response headers via chrome.webRequest
 * - Reads cookie names and flags via chrome.cookies (never values)
 * - Injects the page probes into tabs that were open before install
 * - Runs the analyzer and keeps the toolbar badge count up to date
 */

const FALLBACK_HEAD_TIMEOUT_MS = 2500;

// Listeners must be registered synchronously at top level so Chrome can wake the worker for them.
const WEB_REQUEST_FILTER = { urls: ['http://*/*', 'https://*/*'] };
try {
  chrome.webRequest.onHeadersReceived.addListener(captureResponse, WEB_REQUEST_FILTER, ['responseHeaders', 'extraHeaders']);
} catch {
  chrome.webRequest.onHeadersReceived.addListener(captureResponse, WEB_REQUEST_FILTER, ['responseHeaders']);
}

chrome.tabs.onRemoved.addListener((tabId) => forgetTab(tabId));
// When a tab is swapped for another (instant/prerender replacement), the old ID is gone for good.
chrome.tabs.onReplaced.addListener((_addedTabId, removedTabId) => forgetTab(removedTabId));

class RestrictedPageError extends Error {
  constructor(message) {
    super(message);
    this.code = 'restricted';
  }
}

function isInspectableUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url);
}

async function fetchFallbackHeaders(url) {
  const headers = {};
  if (!isInspectableUrl(url)) return headers;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FALLBACK_HEAD_TIMEOUT_MS);
  try {
    const resp = await fetch(url, { method: 'HEAD', cache: 'no-store', credentials: 'omit', signal: controller.signal });
    resp.headers.forEach((value, key) => {
      const lk = key.toLowerCase();
      if (lk !== 'set-cookie' && lk !== '__proto__' && lk !== 'constructor' && lk !== 'prototype') {
        headers[lk] = value;
      }
    });
  } catch {
    // Blocked by the network or the server rejected HEAD; analysis continues without headers.
  } finally {
    clearTimeout(timer);
  }
  return headers;
}

async function getCookiesForUrl(url) {
  if (!isInspectableUrl(url)) return [];
  try {
    const cookies = await chrome.cookies.getAll({ url });
    // Strip values immediately so they never reach the analyzer, popup or exports.
    return cookies.map(({ name, domain, httpOnly, secure, sameSite, session }) => ({
      name,
      domain,
      httpOnly,
      secure,
      sameSite,
      session
    }));
  } catch {
    return [];
  }
}

async function collectSnapshot(tabId) {
  const request = { type: 'DEEPSTACK_COLLECT_PAGE' };
  try {
    const response = await chrome.tabs.sendMessage(tabId, request);
    if (response?.ok && response.snapshot) return response.snapshot;
  } catch {
    // No content script yet (tab opened before the extension was installed or reloaded)
  }

  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['src/content/main-world-probe.js'], world: 'MAIN' });
    await chrome.scripting.executeScript({ target: { tabId }, files: ['src/content/isolated-collector.js'], world: 'ISOLATED' });
  } catch (err) {
    throw new RestrictedPageError(
      /cannot be scripted|cannot access|chrome:\/\/|webstore|extensions gallery/i.test(err?.message || '')
        ? 'The browser does not allow extensions to read this page.'
        : `Could not access this page (${err?.message || 'unknown error'}).`
    );
  }

  const response = await chrome.tabs.sendMessage(tabId, request);
  if (response?.ok && response.snapshot) return response.snapshot;
  throw new Error('The page did not return any data. Try reloading it.');
}

function updateBadge(tabId, count) {
  const text = count > 0 ? String(count) : '';
  chrome.action.setBadgeText({ tabId, text }).catch(() => {});
  chrome.action.setBadgeBackgroundColor({ tabId, color: '#1C1C1F' }).catch(() => {});
  chrome.action.setBadgeTextColor?.({ tabId, color: '#F4F4F5' })?.catch?.(() => {});
}

/**
 * @param {number} tabId
 * @param {{ snapshot?: object, withNetworkLookups?: boolean }} options
 *   withNetworkLookups: run DNS-over-HTTPS + HEAD fallback. Only true for user-initiated popup scans,
 *   so passive page loads never send anything off the device.
 */
async function buildReport(tabId, { snapshot = null, withNetworkLookups = false } = {}) {
  const page = snapshot || (await collectSnapshot(tabId));
  const entry = await getTabEntryForUrl(tabId, page.url);
  const settings = withNetworkLookups ? await getSettings() : { dnsLookups: false };
  const needsFallback = withNetworkLookups && Object.keys(entry.mainHeaders).length === 0;

  const [fallbackHeaders, cookies, dnsInfo] = await Promise.all([
    needsFallback ? fetchFallbackHeaders(page.url) : null,
    getCookiesForUrl(page.url),
    settings.dnsLookups ? inspectDnsInfrastructure(page.hostname) : null
  ]);

  const headers = buildHeaderMap(entry, fallbackHeaders);
  const report = analyzeFullStack({
    snapshot: page,
    headers,
    cookies,
    observedUrls: Array.from(entry.observed),
    dnsInfo
  });
  const hasHeaders = Object.keys(headers).some((k) => k !== 'set-cookie');
  report.headerSource = Object.keys(entry.mainHeaders).length > 0 ? 'captured' : hasHeaders ? 'fallback' : 'none';
  // Without headers every header check "fails"; don't present that as a real F grade.
  report.securityAudit.headersMissing = !hasHeaders;
  report.dnsLookupEnabled = settings.dnsLookups;

  updateBadge(tabId, report.totalDetected);
  return report;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || sender.id !== chrome.runtime.id) return false;

  // Passive push from the content script after page load: only refreshes the badge.
  if (message.type === 'DEEPSTACK_PAGE_SNAPSHOT' && sender.tab?.id !== undefined) {
    buildReport(sender.tab.id, { snapshot: message.snapshot })
      .then((report) => sendResponse({ ok: true, totalDetected: report.totalDetected }))
      .catch((err) => sendResponse({ ok: false, error: String(err?.message || err) }));
    return true;
  }

  // User opened the popup.
  if (message.type === 'DEEPSTACK_INSPECT_TAB' && Number.isInteger(message.tabId)) {
    buildReport(message.tabId, { withNetworkLookups: true })
      .then((report) => sendResponse({ ok: true, report }))
      .catch((err) => sendResponse({ ok: false, code: err?.code || 'error', error: String(err?.message || err) }));
    return true;
  }

  return false;
});
