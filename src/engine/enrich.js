import { SIG_BY_ID } from './compiled-signatures.js';
import { shortenUrl } from './url.js';

/** Fills in versions, DNS-derived hosting, platform features and implied dependencies. */
export function enrichDetections(ctx, detections, addEvidence) {
  const { snapshot, domSignals, scripts, links, normHeaders, dnsInfo } = ctx;

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
}
