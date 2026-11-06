import { parseCspHeader } from './csp.js';
import { createDetectionStore } from './detections.js';
import { enrichDetections } from './enrich.js';
import { matchSignatures } from './match-signatures.js';
import { analyzeNetworkAndApis } from './network.js';
import { analyzeSecurityPosture } from './security.js';
import { buildArchitectureSummary } from './summary.js';

/**
 * DeepStack analyzer entry point.
 * Correlates JS runtime probes, DOM markers, CSS tokens, response headers, cookie names,
 * storage key names, network resources and CSP directives into a single report.
 * Pure function: no I/O, safe to run in the service worker or in tests.
 */

const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function normalizeHeaders(headers) {
  const out = Object.create(null);
  for (const [k, v] of Object.entries(headers || {})) {
    const lk = k.toLowerCase();
    if (!BLOCKED_KEYS.has(lk)) out[lk] = String(v);
  }
  return out;
}

function buildContext({ snapshot, headers, cookies, observedUrls, dnsInfo }) {
  const meta = snapshot.metaAndSeo?.meta || {};
  const normHeaders = normalizeHeaders(headers);
  const cspAnalysis = parseCspHeader(
    normHeaders['content-security-policy'] ||
      normHeaders['content-security-policy-report-only'] ||
      (Object.hasOwn(meta, 'content-security-policy') ? meta['content-security-policy'] : '') ||
      ''
  );

  const scripts = (snapshot.scripts || []).map((s) => s.src).filter(Boolean);
  const links = (snapshot.links || []).map((l) => l.href).filter(Boolean);
  const perfUrls = (snapshot.mainProbe?.perf?.resourceSummary?.urls || []).map((u) => u.url);
  const activeUrlSet = new Set([...scripts, ...links, ...perfUrls, ...observedUrls]);
  // CSP hosts are matched too, but reported as "CSP Policy" evidence with lower weight.
  const allNetworkUrls = Array.from(
    new Set([...activeUrlSet, ...cspAnalysis.allExternalHosts.map((h) => `https://${h}/`)])
  );
  const storage = snapshot.mainProbe?.capabilities?.storage || {};

  return {
    snapshot,
    dnsInfo,
    cookies,
    meta,
    normHeaders,
    cspAnalysis,
    scripts,
    links,
    activeUrlSet,
    allNetworkUrls,
    jsSignals: snapshot.mainProbe?.jsSignals || {},
    domSignals: snapshot.domSignals || {},
    cssVarPrefixes: snapshot.designSystem?.cssVarPrefixes || {},
    storageKeys: [...(storage.localStorageKeys || []), ...(storage.sessionStorageKeys || [])]
  };
}

function groupByCategory(technologies) {
  const groups = {};
  for (const tech of technologies) {
    if (!groups[tech.category]) {
      groups[tech.category] = {
        id: tech.category,
        label: tech.categoryLabel,
        iconKey: tech.categoryIconKey,
        description: tech.categoryDescription,
        order: tech.categoryOrder,
        items: []
      };
    }
    groups[tech.category].items.push(tech);
  }
  return Object.values(groups).sort((a, b) => a.order - b.order);
}

export function analyzeFullStack({ snapshot = {}, headers = {}, cookies = [], observedUrls = [], dnsInfo = null }) {
  const ctx = buildContext({ snapshot, headers, cookies, observedUrls, dnsInfo });
  const { detections, addEvidence } = createDetectionStore();

  matchSignatures(ctx, addEvidence);
  enrichDetections(ctx, detections, addEvidence);

  const technologies = Array.from(detections.values()).sort((a, b) =>
    a.categoryOrder !== b.categoryOrder ? a.categoryOrder - b.categoryOrder : b.confidence - a.confidence
  );

  const perf = snapshot.mainProbe?.perf || {};
  const networkArchitecture = analyzeNetworkAndApis({
    hostname: snapshot.hostname || '',
    perfUrls: perf.resourceSummary?.urls || [],
    resourceSummary: perf.resourceSummary || {},
    observedUrls,
    cspAnalysis: ctx.cspAnalysis,
    navigation: perf.navigation || {},
    headers: ctx.normHeaders
  });

  const securityAudit = analyzeSecurityPosture({
    protocol: snapshot.protocol || 'https:',
    headers: ctx.normHeaders,
    cookies,
    cspAnalysis: ctx.cspAnalysis
  });

  const { executiveSummary, topologyLayers } = buildArchitectureSummary(technologies, snapshot.mainProbe?.frameworkInternals);

  return {
    analyzedAt: Date.now(),
    url: snapshot.url,
    hostname: snapshot.hostname,
    title: snapshot.metaAndSeo?.title || '',
    totalDetected: technologies.length,
    executiveSummary,
    topologyLayers,
    technologies,
    categories: groupByCategory(technologies),
    internals: {
      react: snapshot.mainProbe?.react || null,
      frameworkInternals: snapshot.mainProbe?.frameworkInternals || null,
      capabilities: snapshot.mainProbe?.capabilities || null
    },
    networkArchitecture,
    dnsInfrastructure: dnsInfo,
    securityAudit,
    designSystem: snapshot.designSystem || null,
    metaAndSeo: snapshot.metaAndSeo || null
  };
}
