/** Network timing, delivery and API endpoint discovery. */

const STATIC_ASSET_RE = /\.(m?js|css|map|png|jpe?g|gif|svg|webp|avif|ico|woff2?|ttf|otf|eot|mp4|webm|mp3|wasm|html?)$/;
const DATA_INITIATORS = new Set(['fetch', 'xmlhttprequest', 'beacon', 'eventsource']);

/** Returns the API style for a request URL, or null when it looks like a static asset or page. */
export function classifyApiRequest(u, initiatorType) {
  const path = u.pathname.toLowerCase();
  if (u.protocol === 'wss:' || u.protocol === 'ws:' || path.includes('/socket.io')) return 'WebSocket';
  if (STATIC_ASSET_RE.test(path)) return null;
  if (path.includes('/graphql') || path.endsWith('/gql')) return 'GraphQL';
  if (path.includes('/trpc/')) return 'tRPC';
  if (initiatorType === 'eventsource') return 'Server-Sent Events';
  if (
    path.startsWith('/api/') ||
    /\/v\d+(\/|$)/.test(path) ||
    u.hostname.toLowerCase().startsWith('api.') ||
    DATA_INITIATORS.has(initiatorType)
  ) {
    return 'REST / Fetch';
  }
  return null;
}

export function analyzeNetworkAndApis({ hostname, perfUrls, resourceSummary, observedUrls, cspAnalysis, navigation, headers }) {
  const apiEndpoints = [];
  const externalDomains = new Map();
  const activeHostSet = new Set();

  // Same request can appear in both PerformanceResourceTiming and webRequest; prefer the richer timing entry.
  const byUrl = new Map();
  for (const u of observedUrls) byUrl.set(u, { url: u, initiatorType: 'network' });
  for (const e of perfUrls) byUrl.set(e.url, e);
  const allEntries = Array.from(byUrl.values());

  const seenApiPaths = new Set();

  for (const entry of allEntries) {
    try {
      const u = new URL(entry.url);
      activeHostSet.add(u.hostname.toLowerCase());

      if (hostname && u.hostname !== hostname && !u.hostname.endsWith(`.${hostname}`)) {
        const cur = externalDomains.get(u.hostname) || { host: u.hostname, count: 0, types: new Set() };
        cur.count++;
        if (entry.initiatorType) cur.types.add(entry.initiatorType);
        externalDomains.set(u.hostname, cur);
      }

      const apiKind = classifyApiRequest(u, entry.initiatorType);

      if (apiKind) {
        const key = `${apiKind}:${u.origin}${u.pathname}`;
        if (!seenApiPaths.has(key) && apiEndpoints.length < 30) {
          seenApiPaths.add(key);
          apiEndpoints.push({
            kind: apiKind,
            host: u.hostname,
            path: u.pathname,
            isSameOrigin: u.hostname === hostname
          });
        }
      }
    } catch {}
  }

  const dormantCspHosts = cspAnalysis.allExternalHosts.filter(h => {
    for (const active of activeHostSet) {
      if (active === h || active.endsWith(`.${h}`) || h.endsWith(`.${active}`)) {
        return false;
      }
    }
    return true;
  });

  const cacheStatus =
    headers['cf-cache-status'] ||
    headers['x-vercel-cache'] ||
    headers['x-cache'] ||
    headers['x-nextjs-cache'] ||
    headers['x-drupal-cache'] ||
    headers['x-litespeed-cache'] ||
    null;

  const compression = headers['content-encoding'] || null;
  const serverHeader = headers['server'] || null;
  const poweredBy = headers['x-powered-by'] || null;
  const ageSeconds = headers['age'] ? parseInt(headers['age'], 10) : null;

  // Speed rating for TTFB
  let speedRating = null;
  if (typeof navigation.ttfbMs === 'number') {
    if (navigation.ttfbMs <= 200) speedRating = 'Fast';
    else if (navigation.ttfbMs <= 600) speedRating = 'Moderate';
    else speedRating = 'Slow';
  }

  return {
    protocol: navigation.protocol || (headers['alt-svc']?.includes('h3') ? 'h3' : 'http'),
    ttfbMs: navigation.ttfbMs,
    speedRating,
    fcpMs: navigation.fcpMs ?? null,
    domInteractiveMs: navigation.domInteractiveMs,
    domCompleteMs: navigation.domCompleteMs,
    transferSizeBytes: navigation.transferSize || 0,
    decodedSizeBytes: navigation.decodedBodySize || 0,
    totalResourceCount: resourceSummary.totalCount || 0,
    totalResourceBytes: resourceSummary.totalTransferBytes || 0,
    byInitiator: resourceSummary.byInitiator || {},
    serverTiming: navigation.serverTiming || [],
    cacheStatus,
    compression,
    serverHeader,
    poweredBy,
    ageSeconds,
    apiEndpoints,
    externalDomains: Array.from(externalDomains.values())
      .map(d => ({ host: d.host, count: d.count, types: Array.from(d.types) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 25),
    dormantCspHosts: dormantCspHosts.slice(0, 30)
  };
}
