import { CATEGORIES, SIGNATURES } from './signatures.js';

function compileRegexList(list) {
  if (!Array.isArray(list)) return null;
  return list
    .map((pat) => {
      try {
        return new RegExp(pat, 'i');
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function compileRegexMap(mapObj) {
  if (!mapObj || typeof mapObj !== 'object') return null;
  const compiled = [];
  for (const [key, pat] of Object.entries(mapObj)) {
    try {
      compiled.push([key.toLowerCase(), key, new RegExp(pat, 'i')]);
    } catch {}
  }
  return compiled.length > 0 ? compiled : null;
}

// Pre-compile all 196+ signature regexes once at module initialization
const COMPILED_SIGNATURES = SIGNATURES.map((sig) => {
  const slug = sig.id.replace(/_/g, '[-_]?');
  let urlVerRe = null;
  try {
    urlVerRe = new RegExp(`(?:${slug})[^/?#]*?(?:@|/|\\bver=|-)(\\d+\\.\\d+(?:\\.\\d+)?)`, 'i');
  } catch {}
  return {
    ...sig,
    _headers: compileRegexMap(sig.headers),
    _cookies: compileRegexList(sig.cookies),
    _scripts: compileRegexList(sig.scripts),
    _links: compileRegexList(sig.links),
    _meta: compileRegexMap(sig.meta),
    _storage: compileRegexList(sig.storage),
    _network: compileRegexList(sig.network),
    _urlVerRe: urlVerRe
  };
});

const SIG_BY_ID = new Map(COMPILED_SIGNATURES.map((s) => [s.id, s]));

/**
 * DeepStack Full-Stack Analyzer Engine
 * Combines JS runtime probes, DOM heuristics, CSS variables, HTTP headers,
 * cookies, storage keys, network resources, and CSP directives into a
 * comprehensive technology & architecture report with plain-English explanations.
 */
export function analyzeFullStack({
  snapshot = {},
  headers = {},
  cookies = [],
  observedUrls = [],
  dnsInfo = null
}) {
  const detections = new Map();

  function addEvidence(sig, evidenceType, detail, weight = 50, extractedVersion = null) {
    if (!detections.has(sig.id)) {
      const cat = CATEGORIES[sig.category] || {
        id: sig.category,
        label: sig.category,
        iconKey: 'code',
        description: '',
        order: 99
      };
      detections.set(sig.id, {
        id: sig.id,
        name: sig.name,
        description: sig.description || cat.description || '',
        category: sig.category,
        categoryLabel: cat.label,
        categoryIconKey: cat.iconKey || 'code',
        categoryDescription: cat.description || '',
        categoryOrder: cat.order,
        website: sig.website || null,
        version: null,
        confidence: 0,
        evidence: [],
        implies: sig.implies || []
      });
    }

    const item = detections.get(sig.id);
    if (extractedVersion && !item.version && typeof extractedVersion === 'string' && /^[\d.vA-Za-z-]+$/.test(extractedVersion)) {
      item.version = extractedVersion.replace(/^v/i, '');
    }

    const exists = item.evidence.some(e => e.type === evidenceType && e.detail === detail);
    if (!exists) {
      item.evidence.push({ type: evidenceType, detail });
      item.confidence = Math.min(100, item.confidence + weight);
    }
  }

  const jsSignals = snapshot.mainProbe?.jsSignals || {};
  const domSignals = snapshot.domSignals || {};
  const cssVarPrefixes = snapshot.designSystem?.cssVarPrefixes || {};
  const scripts = (snapshot.scripts || []).map(s => s.src).filter(Boolean);
  const links = (snapshot.links || []).map(l => l.href).filter(Boolean);
  const meta = snapshot.metaAndSeo?.meta || {};
  const storageKeys = [
    ...(snapshot.mainProbe?.capabilities?.storage?.localStorageKeys || []),
    ...(snapshot.mainProbe?.capabilities?.storage?.sessionStorageKeys || [])
  ];

  // Normalize headers to lowercase null-prototype map
  const normHeaders = Object.create(null);
  for (const [k, v] of Object.entries(headers || {})) {
    const lk = k.toLowerCase();
    if (lk !== '__proto__' && lk !== 'constructor' && lk !== 'prototype') {
      normHeaders[lk] = String(v);
    }
  }

  // Extract CSP domains so network rules can also match CSP-whitelisted services
  const cspAnalysis = parseCspHeader(
    normHeaders['content-security-policy'] ||
      normHeaders['content-security-policy-report-only'] ||
      (Object.hasOwn(meta, 'content-security-policy') ? meta['content-security-policy'] : '') ||
      ''
  );

  // Combine all URLs from scripts, links, PerformanceResourceTiming, webRequest, and CSP
  const perfUrls = (snapshot.mainProbe?.perf?.resourceSummary?.urls || []).map(u => u.url);
  const activeUrlSet = new Set([...scripts, ...links, ...perfUrls, ...observedUrls]);
  const allNetworkUrls = Array.from(new Set([
    ...activeUrlSet,
    ...cspAnalysis.allExternalHosts.map(h => `https://${h}/`)
  ]));

  // Evaluate each pre-compiled signature (zero RegExp allocations in hot loop)
  for (const sig of COMPILED_SIGNATURES) {
    // 1. JS Global Probe
    if (sig.js && Object.hasOwn(jsSignals, sig.js) && jsSignals[sig.js] !== undefined) {
      const val = jsSignals[sig.js];
      const ver = typeof val === 'string' && val !== 'true' ? val : null;
      addEvidence(
        sig,
        'JS Runtime',
        ver ? `window.${sig.js} detected (v${ver})` : `Global window.${sig.js} object present`,
        85,
        ver
      );
    }

    // 2. DOM Selectors & Heuristics
    if (sig.dom && Object.hasOwn(domSignals, sig.dom) && domSignals[sig.dom]) {
      const ver = sig.id === 'angular' ? domSignals.angularVersion : (sig.id === 'styled_components' ? domSignals.styledComponentsVersion : null);
      addEvidence(
        sig,
        'DOM Markup',
        String(domSignals[sig.dom]),
        75,
        ver
      );
    }

    // 3. CSS Custom Properties
    if (sig.cssVar && Object.hasOwn(cssVarPrefixes, sig.cssVar) && cssVarPrefixes[sig.cssVar] > 0) {
      addEvidence(
        sig,
        'CSS Tokens',
        `${cssVarPrefixes[sig.cssVar]} matching :root CSS variables (--${sig.cssVar}-*)`,
        65
      );
    }

    // 4. HTTP Headers
    if (sig._headers) {
      for (const [lowerKey, origKey, re] of sig._headers) {
        const headerVal = normHeaders[lowerKey];
        if (typeof headerVal === 'string' && headerVal) {
          const match = headerVal.match(re);
          if (match) {
            addEvidence(
              sig,
              'HTTP Header',
              `${origKey}: ${headerVal.slice(0, 90)}`,
              90,
              match[1] || null
            );
          }
        }
      }
    }

    // 5. Cookies
    if (sig._cookies && cookies.length > 0) {
      for (const re of sig._cookies) {
        const matchedCookie = cookies.find(c => re.test(c.name));
        if (matchedCookie) {
          addEvidence(
            sig,
            'Cookie',
            `${matchedCookie.name}${matchedCookie.httpOnly ? ' (HttpOnly)' : ''}`,
            80
          );
        }
      }
    }

    // 6. Script URLs
    if (sig._scripts && scripts.length > 0) {
      for (const re of sig._scripts) {
        for (const sUrl of scripts) {
          const match = sUrl.match(re);
          if (match) {
            addEvidence(
              sig,
              'Script URL',
              shortenUrl(sUrl),
              80,
              match[1] || null
            );
            break;
          }
        }
      }
    }

    // 7. Link hrefs
    if (sig._links && links.length > 0) {
      for (const re of sig._links) {
        for (const lUrl of links) {
          const match = lUrl.match(re);
          if (match) {
            addEvidence(
              sig,
              'Link Tag',
              shortenUrl(lUrl),
              75,
              match[1] || null
            );
            break;
          }
        }
      }
    }

    // 8. Meta tags
    if (sig._meta) {
      for (const [lowerKey, origKey, re] of sig._meta) {
        const mVal = Object.hasOwn(meta, lowerKey) ? meta[lowerKey] : null;
        if (typeof mVal === 'string' && mVal) {
          const match = mVal.match(re);
          if (match) {
            addEvidence(
              sig,
              'Meta Tag',
              `<meta name="${origKey}" content="${mVal.slice(0, 70)}">`,
              90,
              match[1] || null
            );
          }
        }
      }
    }

    // 9. Web Storage Keys
    if (sig._storage && storageKeys.length > 0) {
      for (const re of sig._storage) {
        const matchedKey = storageKeys.find(k => re.test(k));
        if (matchedKey) {
          addEvidence(
            sig,
            'Web Storage',
            `Key "${matchedKey.slice(0, 50)}"`,
            75
          );
        }
      }
    }

    // 10. Network & CSP Subresources
    if (sig._network && allNetworkUrls.length > 0) {
      for (const re of sig._network) {
        for (const netUrl of allNetworkUrls) {
          if (re.test(netUrl)) {
            const isFromCsp = !activeUrlSet.has(netUrl);
            addEvidence(
              sig,
              isFromCsp ? 'CSP Policy' : 'Network Call',
              shortenUrl(netUrl),
              isFromCsp ? 65 : 85
            );
            break;
          }
        }
      }
    }
  }

  // Enrich versions from deep framework probe & CSS/DOM heuristics
  const fwInternals = snapshot.mainProbe?.frameworkInternals?.frameworks || {};
  const reactProbe = snapshot.mainProbe?.react || {};
  if (reactProbe.version && detections.has('react') && !detections.get('react').version) {
    detections.get('react').version = reactProbe.version;
  }
  if (fwInternals.nextjs?.version && detections.has('nextjs') && !detections.get('nextjs').version) {
    detections.get('nextjs').version = fwInternals.nextjs.version;
  }
  if (fwInternals.vue?.version && detections.has('vue') && !detections.get('vue').version) {
    detections.get('vue').version = fwInternals.vue.version;
  }
  if (fwInternals.angular?.version && detections.has('angular') && !detections.get('angular').version) {
    detections.get('angular').version = fwInternals.angular.version;
  }
  if (snapshot.designSystem?.tailwindVersion && detections.has('tailwindcss') && !detections.get('tailwindcss').version) {
    detections.get('tailwindcss').version = snapshot.designSystem.tailwindVersion;
  }
  if (snapshot.designSystem?.bootstrapVersion && detections.has('bootstrap') && !detections.get('bootstrap').version) {
    detections.get('bootstrap').version = snapshot.designSystem.bootstrapVersion;
  }
  if (domSignals.livewireVersion && detections.has('laravel_livewire') && !detections.get('laravel_livewire').version) {
    detections.get('laravel_livewire').version = domSignals.livewireVersion;
  }

  // Generic URL Semver Extractor: check script & link URLs for @1.2.3, /1.2.3/, or ?ver=1.2.3
  const assetUrls = [...scripts, ...links];
  for (const det of detections.values()) {
    if (det.version) continue;
    const compiledSig = SIG_BY_ID.get(det.id);
    const urlVerRe = compiledSig?._urlVerRe;
    if (!urlVerRe) continue;
    for (const u of assetUrls) {
      const m = u.match(urlVerRe);
      if (m && m[1]) {
        det.version = m[1];
        break;
      }
    }
  }

  // Inject DNS CNAME Infrastructure Detections if present
  if (dnsInfo && dnsInfo.cnameProvider) {
    const cnameMap = {
      'Vercel Edge Network': 'vercel',
      'AWS CloudFront': 'aws_cloudfront',
      'Heroku PaaS': 'heroku',
      'Render Cloud': 'render',
      'Railway Cloud': 'railway',
      'Fly.io Edge': 'fly_io',
      'Google Cloud / App Engine': 'google_cloud',
      'Shopify Infrastructure': 'shopify',
      'Webflow Hosting': 'webflow',
      'Squarespace': 'squarespace',
      'Ghost(Pro) Hosting': 'ghost',
      'Netlify Edge': 'netlify',
      'Fastly CDN': 'fastly',
      'Akamai Edge': 'akamai',
      'Cloudflare Network': 'cloudflare',
      'WP Engine (Managed WordPress)': 'wordpress',
      'Kinsta (Managed WordPress)': 'wordpress'
    };
    const mappedId = cnameMap[dnsInfo.cnameProvider.provider];
    if (mappedId && SIG_BY_ID.has(mappedId)) {
      addEvidence(
        SIG_BY_ID.get(mappedId),
        'DNS CNAME',
        `${snapshot.hostname} → ${dnsInfo.cnameProvider.target}`,
        95
      );
    }
  }

  // Automatic Web Standards & Protocol Detections
  const navProto = snapshot.mainProbe?.perf?.navigation?.protocol || '';
  const altSvc = normHeaders['alt-svc'] || '';
  if (navProto === 'h3' || altSvc.includes('h3=')) {
    addEvidence(
      {
        id: 'http3',
        name: 'HTTP/3 (QUIC)',
        category: 'WEB_STANDARDS',
        description: 'Latest UDP-based multiplexed HTTP transport protocol with zero-RTT handshakes',
        website: 'https://en.wikipedia.org/wiki/HTTP/3'
      },
      navProto === 'h3' ? 'Protocol' : 'HTTP Header',
      navProto === 'h3' ? 'Active connection over HTTP/3 (h3)' : `Advertised via alt-svc: ${altSvc.slice(0, 50)}`,
      100
    );
  } else if (navProto === 'h2') {
    addEvidence(
      {
        id: 'http2',
        name: 'HTTP/2',
        category: 'WEB_STANDARDS',
        description: 'Multiplexed binary HTTP protocol with header compression',
        website: 'https://http2.github.io/'
      },
      'Protocol',
      'Active connection over HTTP/2 (h2)',
      100
    );
  }

  if (snapshot.mainProbe?.capabilities?.serviceWorker?.active || snapshot.metaAndSeo?.pwaManifestUrl) {
    const swUrl = snapshot.mainProbe?.capabilities?.serviceWorker?.scriptURL;
    addEvidence(
      {
        id: 'pwa_sw',
        name: 'Service Worker / PWA',
        category: 'WEB_STANDARDS',
        description: 'Background browser worker enabling offline caching and installable web app features',
        website: 'https://web.dev/progressive-web-apps/'
      },
      swUrl ? 'Service Worker' : 'Web Manifest',
      swUrl ? shortenUrl(swUrl) : shortenUrl(snapshot.metaAndSeo.pwaManifestUrl),
      95
    );
  }

  if ((snapshot.metaAndSeo?.jsonLdSchemas || []).length > 0) {
    addEvidence(
      {
        id: 'json_ld',
        name: 'JSON-LD Structured Data',
        category: 'WEB_STANDARDS',
        description: 'Machine-readable Schema.org metadata used by search engines and rich snippets',
        website: 'https://json-ld.org/'
      },
      'Schema.org',
      `Entities: ${snapshot.metaAndSeo.jsonLdSchemas.slice(0, 5).join(', ')}`,
      100
    );
  }

  if (snapshot.metaAndSeo?.hasSpeculationRules) {
    addEvidence(
      {
        id: 'speculation_rules',
        name: 'Speculation Rules API',
        category: 'WEB_STANDARDS',
        description: 'Browser API that prefetches or prerenders likely next navigations in the background',
        website: 'https://developer.chrome.com/docs/web-platform/prerender-pages'
      },
      'DOM Markup',
      '<script type="speculationrules"> active',
      100
    );
  }

  if (snapshot.metaAndSeo?.hasImportMap) {
    addEvidence(
      {
        id: 'import_maps',
        name: 'ES Import Maps',
        category: 'WEB_STANDARDS',
        description: 'Native browser mapping for bare JavaScript module specifiers',
        website: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap'
      },
      'DOM Markup',
      '<script type="importmap"> active',
      100
    );
  }

  // Resolve Implied Technologies (2-pass graph resolution)
  for (let pass = 0; pass < 2; pass++) {
    for (const det of Array.from(detections.values())) {
      for (const impliedId of det.implies || []) {
        const targetSig = SIG_BY_ID.get(impliedId);
        if (targetSig) {
          addEvidence(
            targetSig,
            'Inferred',
            `Required by ${det.name}`,
            65
          );
        }
      }
    }
  }

  // Group and sort detected technologies
  const technologies = Array.from(detections.values()).sort((a, b) => {
    if (a.categoryOrder !== b.categoryOrder) return a.categoryOrder - b.categoryOrder;
    return b.confidence - a.confidence;
  });

  const groupedByCategory = {};
  for (const tech of technologies) {
    if (!groupedByCategory[tech.category]) {
      groupedByCategory[tech.category] = {
        id: tech.category,
        label: tech.categoryLabel,
        iconKey: tech.categoryIconKey,
        description: tech.categoryDescription,
        order: tech.categoryOrder,
        items: []
      };
    }
    groupedByCategory[tech.category].items.push(tech);
  }

  // Deep Network & API Endpoint Discovery
  const networkArchitecture = analyzeNetworkAndApis({
    hostname: snapshot.hostname || '',
    perfUrls: snapshot.mainProbe?.perf?.resourceSummary?.urls || [],
    resourceSummary: snapshot.mainProbe?.perf?.resourceSummary || {},
    observedUrls,
    cspAnalysis,
    navigation: snapshot.mainProbe?.perf?.navigation || {},
    headers: normHeaders
  });

  // Security & Header Audit
  const securityAudit = analyzeSecurityPosture({
    protocol: snapshot.protocol || 'https:',
    headers: normHeaders,
    cookies,
    cspAnalysis
  });

  // Build Human-Friendly Executive Summary & 4-Layer Topology
  const { executiveSummary, topologyLayers } = buildArchitectureSummary(
    technologies,
    snapshot.mainProbe?.frameworkInternals
  );

  return {
    analyzedAt: Date.now(),
    url: snapshot.url,
    hostname: snapshot.hostname,
    title: snapshot.metaAndSeo?.title || '',
    totalDetected: technologies.length,
    executiveSummary,
    topologyLayers,
    technologies,
    categories: Object.values(groupedByCategory).sort((a, b) => a.order - b.order),
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

function buildArchitectureSummary(technologies, frameworkInternals) {
  const byCat = (cats) =>
    technologies
      .filter(t => cats.includes(t.category))
      .map(t => (t.version ? `${t.name} v${t.version}` : t.name));

  const uiTech = byCat(['SSR_META', 'FRAMEWORK']);
  const cssTech = byCat(['CSS_UI']);
  const cmsTech = byCat(['CMS_ECOMM']);
  const edgeTech = byCat(['CDN_EDGE', 'SERVER']);
  const backendTech = byCat(['BACKEND', 'BAAS_DB', 'STATE_DATA']);
  const serviceTech = byCat(['AUTH', 'PAYMENTS', 'ANALYTICS', 'OBSERVABILITY', 'AI_AGENTS', 'SUPPORT_CRM']);

  const parts = [];
  if (uiTech.length > 0) {
    parts.push(`built with **${uiTech.slice(0, 2).join(' & ')}**`);
  } else if (cmsTech.length > 0) {
    parts.push(`powered by **${cmsTech.slice(0, 2).join(' & ')}**`);
  }

  if (cssTech.length > 0) {
    parts.push(`styled using **${cssTech.slice(0, 2).join(' + ')}**`);
  }

  if (edgeTech.length > 0) {
    parts.push(`delivered via **${edgeTech.slice(0, 2).join(' / ')}**`);
  }

  if (serviceTech.length > 0) {
    parts.push(`integrated with **${serviceTech.slice(0, 3).join(', ')}**`);
  }

  let executiveSummary = 'Standard HTML/CSS web page with minimal external framework footprints.';
  if (parts.length > 0) {
    const joined = parts.join(', ');
    executiveSummary = `This site is ${joined}.`;
  }

  const topologyLayers = [
    {
      id: 'frontend',
      label: 'Interface & Styling',
      items: [...uiTech, ...cssTech].slice(0, 5)
    },
    {
      id: 'data_backend',
      label: 'Backend, CMS & Data',
      items: [...cmsTech, ...backendTech].slice(0, 5)
    },
    {
      id: 'infra',
      label: 'Hosting & Edge',
      items: edgeTech.slice(0, 5)
    },
    {
      id: 'services',
      label: 'Services & Telemetry',
      items: serviceTech.slice(0, 5)
    }
  ].filter(layer => layer.items.length > 0);

  return { executiveSummary, topologyLayers };
}

function shortenUrl(url) {
  try {
    const u = new URL(url);
    const path = u.pathname.length > 48 ? u.pathname.slice(0, 22) + '…' + u.pathname.slice(-22) : u.pathname;
    return `${u.hostname}${path}`;
  } catch {
    return String(url).slice(0, 75);
  }
}

function parseCspHeader(cspString) {
  const result = {
    present: Boolean(cspString && cspString.trim()),
    directives: {},
    allExternalHosts: [],
    hasUnsafeInline: false,
    hasUnsafeEval: false
  };
  if (!result.present) return result;

  const hostSet = new Set();
  const parts = cspString.split(';').map(s => s.trim()).filter(Boolean);
  for (const part of parts) {
    const tokens = part.split(/\s+/);
    const dirName = tokens[0].toLowerCase();
    const values = tokens.slice(1);
    result.directives[dirName] = values;

    for (const val of values) {
      if (val.includes("'unsafe-inline'")) result.hasUnsafeInline = true;
      if (val.includes("'unsafe-eval'")) result.hasUnsafeEval = true;

      const cleaned = val
        .replace(/^[a-z]+:\/\//i, '')
        .replace(/^\*\./, '')
        .replace(/\/.*$/, '')
        .replace(/:\d+$/, '');
      if (cleaned && cleaned.includes('.') && !cleaned.startsWith("'") && !cleaned.includes('*')) {
        hostSet.add(cleaned.toLowerCase());
      }
    }
  }

  result.allExternalHosts = Array.from(hostSet).slice(0, 60);
  return result;
}

function analyzeNetworkAndApis({ hostname, perfUrls, resourceSummary, observedUrls, cspAnalysis, navigation, headers }) {
  const apiEndpoints = [];
  const externalDomains = new Map();
  const activeHostSet = new Set();

  const allEntries = [
    ...perfUrls,
    ...observedUrls.map(u => ({ url: u, initiatorType: 'network' }))
  ];

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

      const pathLower = u.pathname.toLowerCase();
      const hostLower = u.hostname.toLowerCase();
      let apiKind = null;

      if (pathLower.includes('/graphql')) {
        apiKind = 'GraphQL';
      } else if (pathLower.includes('/trpc') || pathLower.includes('/api/trpc')) {
        apiKind = 'tRPC';
      } else if (pathLower.includes('/socket.io') || u.protocol === 'wss:' || u.protocol === 'ws:') {
        apiKind = 'WebSocket';
      } else if (
        pathLower.startsWith('/api/') ||
        pathLower.includes('/v1/') ||
        pathLower.includes('/v2/') ||
        pathLower.includes('/v3/') ||
        hostLower.startsWith('api.') ||
        ((entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') && !pathLower.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff2?|ico)$/))
      ) {
        apiKind = 'REST / Fetch';
      }

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
  let speedRating = 'Good';
  if (navigation.ttfbMs !== null && navigation.ttfbMs !== undefined) {
    if (navigation.ttfbMs <= 200) speedRating = 'Fast';
    else if (navigation.ttfbMs <= 600) speedRating = 'Moderate';
    else speedRating = 'Slow';
  }

  return {
    protocol: navigation.protocol || (headers['alt-svc']?.includes('h3') ? 'h3' : 'http'),
    ttfbMs: navigation.ttfbMs,
    speedRating,
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

function analyzeSecurityPosture({ protocol, headers, cookies, cspAnalysis }) {
  let score = 0;
  const checks = [];

  // 1. HTTPS
  const isHttps = protocol === 'https:';
  if (isHttps) score += 15;
  checks.push({
    name: 'Encrypted Connection (HTTPS)',
    explanation: 'Encrypts traffic between your browser and the website so third parties cannot intercept it.',
    status: isHttps ? 'pass' : 'fail',
    value: isHttps ? 'Active (TLS/HTTPS)' : 'Unencrypted HTTP',
    impact: 'High'
  });

  // 2. HSTS
  const hsts = headers['strict-transport-security'];
  if (hsts) {
    score += 20;
    checks.push({
      name: 'Strict HTTPS Enforcement (HSTS)',
      explanation: 'Instructs browsers to only connect via HTTPS and blocks protocol downgrade attacks.',
      status: 'pass',
      value: hsts.slice(0, 80),
      impact: 'High'
    });
  } else {
    checks.push({
      name: 'Strict HTTPS Enforcement (HSTS)',
      explanation: 'Instructs browsers to only connect via HTTPS and blocks protocol downgrade attacks.',
      status: 'warn',
      value: 'Not configured',
      impact: 'High'
    });
  }

  // 3. CSP
  if (cspAnalysis.present) {
    const strict = !cspAnalysis.hasUnsafeInline && !cspAnalysis.hasUnsafeEval;
    score += strict ? 25 : 15;
    checks.push({
      name: 'Content Security Policy (XSS Protection)',
      explanation: 'Restricts which external domains can execute scripts or receive data from this page.',
      status: strict ? 'pass' : 'warn',
      value: strict
        ? `Strict policy (${Object.keys(cspAnalysis.directives).length} rules)`
        : `Permissive (${cspAnalysis.hasUnsafeInline ? 'allows inline scripts' : 'allows eval'})`,
      impact: 'High'
    });
  } else {
    checks.push({
      name: 'Content Security Policy (XSS Protection)',
      explanation: 'Restricts which external domains can execute scripts or receive data from this page.',
      status: 'fail',
      value: 'Missing policy header',
      impact: 'High'
    });
  }

  // 4. X-Content-Type-Options
  const xcto = headers['x-content-type-options'];
  const xctoOk = xcto && xcto.toLowerCase().includes('nosniff');
  if (xctoOk) score += 10;
  checks.push({
    name: 'MIME-Sniffing Prevention',
    explanation: 'Prevents the browser from executing disguised file uploads as executable scripts.',
    status: xctoOk ? 'pass' : 'warn',
    value: xctoOk ? 'nosniff enabled' : 'Not set',
    impact: 'Medium'
  });

  // 5. Clickjacking Protection
  const xfo = headers['x-frame-options'];
  const frameAncestors = cspAnalysis.directives['frame-ancestors'];
  if (xfo || frameAncestors) {
    score += 10;
    checks.push({
      name: 'Clickjacking Frame Protection',
      explanation: 'Blocks malicious websites from embedding this page inside an invisible iframe.',
      status: 'pass',
      value: xfo ? `X-Frame-Options: ${xfo}` : `CSP frame-ancestors`,
      impact: 'Medium'
    });
  } else {
    checks.push({
      name: 'Clickjacking Frame Protection',
      explanation: 'Blocks malicious websites from embedding this page inside an invisible iframe.',
      status: 'warn',
      value: 'Embedding not restricted',
      impact: 'Medium'
    });
  }

  // 6. Referrer-Policy
  const refPol = headers['referrer-policy'];
  if (refPol) score += 10;
  checks.push({
    name: 'Referrer Privacy Policy',
    explanation: 'Controls how much URL information is shared when clicking links to external sites.',
    status: refPol ? 'pass' : 'info',
    value: refPol || 'Browser default',
    impact: 'Low'
  });

  // 7. Permissions-Policy
  const permPol = headers['permissions-policy'];
  if (permPol) score += 5;
  checks.push({
    name: 'Hardware & Sensor Permissions Policy',
    explanation: 'Restricts access to camera, microphone, geolocation, and payment APIs.',
    status: permPol ? 'pass' : 'info',
    value: permPol ? 'Restricted by policy' : 'Not specified',
    impact: 'Low'
  });

  // 8. Cross-Origin Isolation
  const coop = headers['cross-origin-opener-policy'];
  const corp = headers['cross-origin-resource-policy'];
  if (coop || corp) score += 5;
  checks.push({
    name: 'Cross-Origin Process Isolation',
    explanation: 'Isolates the browser tab process from cross-origin popups and memory attacks.',
    status: (coop || corp) ? 'pass' : 'info',
    value: [coop ? `COOP: ${coop}` : null, corp ? `CORP: ${corp}` : null].filter(Boolean).join(' · ') || 'Standard isolation',
    impact: 'Low'
  });

  let grade = 'F';
  if (score >= 90) grade = 'A+';
  else if (score >= 80) grade = 'A';
  else if (score >= 65) grade = 'B';
  else if (score >= 50) grade = 'C';
  else if (score >= 35) grade = 'D';

  const cookieSummary = {
    total: cookies.length,
    httpOnlyCount: cookies.filter(c => c.httpOnly).length,
    secureCount: cookies.filter(c => c.secure).length,
    sessionCount: cookies.filter(c => c.session).length,
    items: cookies.slice(0, 35).map(c => ({
      name: c.name,
      domain: c.domain,
      httpOnly: Boolean(c.httpOnly),
      secure: Boolean(c.secure),
      sameSite: c.sameSite || 'unspecified',
      session: Boolean(c.session)
    }))
  };

  return {
    score,
    grade,
    checks,
    cookieSummary,
    rawHeaders: headers
  };
}
