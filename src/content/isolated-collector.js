/**
 * DeepStack Isolated-World Collector
 * Collects DOM structure, scripts, links, meta tags, JSON-LD, CSS tokens,
 * computed design system (color palette & typography), and bridges with the Main-World Probe.
 */
(function () {
  // Generation counter instead of a "loaded" flag: after the extension is reloaded or updated, the
  // old script is orphaned (it can no longer receive messages) but its window globals can survive.
  // A plain flag would then stop the re-injected script from registering, breaking already-open tabs.
  // Only the newest generation answers requests.
  const generation = (window.__DEEPSTACK_ISOLATED_GEN__ || 0) + 1;
  window.__DEEPSTACK_ISOLATED_GEN__ = generation;
  const isCurrent = () => window.__DEEPSTACK_ISOLATED_GEN__ === generation;

  const MAX_PROBE_BYTES = 1_500_000;
  let latestMainProbe = null;

  function sanitizeMainProbePayload(raw) {
    if (!raw || typeof raw !== 'object') return null;
    try {
      // The page can post a spoofed payload; cap its size so it can't bloat messaging or storage.
      if (JSON.stringify(raw).length > MAX_PROBE_BYTES) return null;
    } catch {
      return null;
    }
    const cleanSignals = Object.create(null);
    if (raw.jsSignals && typeof raw.jsSignals === 'object') {
      const entries = Object.entries(raw.jsSignals).slice(0, 150);
      for (const [k, v] of entries) {
        if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
        if (typeof v === 'boolean') {
          cleanSignals[k] = v;
        } else if (typeof v === 'string' || typeof v === 'number') {
          cleanSignals[k] = String(v).slice(0, 80);
        }
      }
    }
    return {
      timestamp: typeof raw.timestamp === 'number' ? raw.timestamp : Date.now(),
      react: raw.react && typeof raw.react === 'object' ? raw.react : null,
      frameworkInternals: raw.frameworkInternals && typeof raw.frameworkInternals === 'object' ? raw.frameworkInternals : null,
      jsSignals: cleanSignals,
      perf: raw.perf && typeof raw.perf === 'object' ? raw.perf : null,
      capabilities: raw.capabilities && typeof raw.capabilities === 'object' ? raw.capabilities : null
    };
  }

  const isProbeMessage = (event) =>
    event.source === window && event.data && event.data.source === '__DEEPSTACK_MAIN_PROBE__';

  window.addEventListener('message', (event) => {
    if (isProbeMessage(event)) latestMainProbe = sanitizeMainProbePayload(event.data.payload);
  });

  // The main-world probe answers a CustomEvent with a window.postMessage (the two worlds share the DOM, not globals).
  function requestFreshMainProbe() {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        window.removeEventListener('message', handler);
        resolve(latestMainProbe);
      }, 1500);

      const handler = (event) => {
        if (isProbeMessage(event)) {
          clearTimeout(timeout);
          window.removeEventListener('message', handler);
          latestMainProbe = sanitizeMainProbePayload(event.data.payload);
          resolve(latestMainProbe);
        }
      };

      window.addEventListener('message', handler);
      window.dispatchEvent(new CustomEvent('__DEEPSTACK_REQUEST_MAIN_PROBE__'));
    });
  }

  function rgbToHex(rgbStr) {
    if (!rgbStr || rgbStr === 'transparent' || rgbStr === 'rgba(0, 0, 0, 0)') return null;
    const match = rgbStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!match) return null;
    if (match[4] !== undefined && parseFloat(match[4]) < 0.15) return null;
    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  const TW_PATTERNS = [
    /^(flex|grid|hidden|block|inline-flex)$/,
    /^(items|justify)-(center|between|start|end)$/,
    /^[mp][xytblr]?-\d+$/,
    /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl)$/,
    /^font-(normal|medium|semibold|bold)$/,
    /^rounded(-[a-z0-9]+)?$/,
    /^(bg|text|border)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}$/,
    /^(hover|focus|dark|sm|md|lg|xl):/
  ];

  function collectDomSignals() {
    const dom = {};
    const htmlEl = document.documentElement;

    let hasVueScopedAttr = false;
    let hasNgAttr = false;
    let hasSvelteClass = false;
    let hasAstroAttr = false;
    let hasEmotionAttr = false;
    let tailwindScore = 0;

    const seenTwClasses = new Set();

    // Fast O(300) TreeWalker traversal without allocating full DOM NodeList
    if (htmlEl) {
      const walker = document.createTreeWalker(htmlEl, NodeFilter.SHOW_ELEMENT);
      let el = walker.currentNode;
      let count = 0;
      while (el && count < 300) {
        count++;
        const attrs = el.attributes;
        if (attrs) {
          for (let i = 0; i < attrs.length; i++) {
            const name = attrs[i].name;
            if (name.startsWith('data-v-')) hasVueScopedAttr = true;
            else if (name.startsWith('_nghost-') || name.startsWith('_ngcontent-')) hasNgAttr = true;
            else if (name.startsWith('data-astro-cid-')) hasAstroAttr = true;
            else if (name.startsWith('data-emotion')) hasEmotionAttr = true;
          }
        }

        const clsList = el.classList;
        if (clsList && clsList.length > 0) {
          for (let i = 0; i < clsList.length; i++) {
            const c = clsList[i];
            if (c.startsWith('svelte-')) hasSvelteClass = true;
            if (!seenTwClasses.has(c)) {
              for (let j = 0; j < TW_PATTERNS.length; j++) {
                if (TW_PATTERNS[j].test(c)) {
                  seenTwClasses.add(c);
                  tailwindScore++;
                  break;
                }
              }
            }
          }
        }
        el = walker.nextNode();
      }
    }

    const q = (sel) => {
      try {
        return document.querySelector(sel);
      } catch {
        return null;
      }
    };

    if (q('#__next') || q('script#__NEXT_DATA__') || q('next-route-announcer')) {
      dom.nextjs = '#__next / __NEXT_DATA__';
    }
    if (q('[data-reactroot]') || q('[data-reactid]') || q('#__next')) {
      dom.react = '[data-reactroot] / root container';
    }
    if (q('#__nuxt') || q('#__layout') || q('script#__NUXT_DATA__')) {
      dom.nuxt = '#__nuxt / __NUXT_DATA__';
    }
    if (hasVueScopedAttr || q('[data-v-app]')) {
      dom.vue = hasVueScopedAttr ? 'data-v-* scoped CSS attributes' : '[data-v-app]';
    }
    if (hasNgAttr || q('[ng-version]')) {
      const ver = q('[ng-version]')?.getAttribute('ng-version');
      dom.angular = ver ? `ng-version="${ver}"` : '_nghost / _ngcontent attributes';
      if (ver) dom.angularVersion = ver;
    }
    if (hasSvelteClass || q('[id="svelte"]')) {
      dom.svelte = 'svelte-* scoped class hash';
    }
    if (hasAstroAttr || q('astro-island') || q('astro-slot')) {
      dom.astro = q('astro-island') ? '<astro-island> custom element' : 'data-astro-cid-* attributes';
    }
    if (q('[q\\:container]')) {
      dom.qwik = '[q:container] resumable root';
    }
    if (q('[hx-get], [hx-post], [hx-target], [hx-swap], [data-hx-get]')) {
      dom.htmx = 'hx-* declarative attributes';
    }
    if (q('[x-data], [x-init], [x-show], [x-bind]')) {
      dom.alpinejs = 'x-data / x-* directives';
    }
    if (tailwindScore >= 6) {
      dom.tailwindcss = `${tailwindScore} utility classes (${Array.from(seenTwClasses).slice(0, 5).join(', ')})`;
    }
    if (q('[wire\\:snapshot], [wire\\:id], [wire\\:initial-data]')) {
      const isV3 = Boolean(q('[wire\\:snapshot]'));
      dom.laravel_livewire = isV3 ? 'wire:snapshot (Livewire v3)' : 'wire:id / wire:initial-data (Livewire v2)';
      dom.livewireVersion = isV3 ? '3.x' : '2.x';
    }
    if (q('turbo-frame, [data-turbo], meta[name="turbo-visit-control"]')) {
      dom.hotwire_turbo = '<turbo-frame> / data-turbo attributes';
    }
    if (q('[data-phx-main], [data-phx-session]')) {
      dom.phoenix_liveview = 'data-phx-main / data-phx-session LiveView root';
    }
    if (q('script[src*="_framework/blazor"]')) {
      dom.blazor = '_framework/blazor runtime script';
    }
    if (q('input[name="__VIEWSTATE"], input[name="__EVENTVALIDATION"]')) {
      dom.aspnet = 'input[name="__VIEWSTATE"] WebForms state';
    }
    if (q('input[name="csrfmiddlewaretoken"]')) {
      dom.django = 'input[name="csrfmiddlewaretoken"] CSRF token';
    }
    if (q('[data-radix-popper-content-wrapper], [data-radix-collection-item], [data-radix-scroll-area-viewport]')) {
      dom.radix_ui = 'data-radix-* primitives';
    }
    if (q('[class*="MuiBox-root"], [class*="MuiButton-root"], [class*="MuiTypography-root"]')) {
      dom.mui = 'Mui*-root component classes';
    }
    if (q('[class*="chakra-"]')) {
      dom.chakra_ui = 'chakra-* component classes';
    }
    if (q('[class*="ant-btn"], [class*="ant-layout"], [class*="ant-col"]')) {
      dom.ant_design = 'ant-* component classes';
    }
    if (q('[class*="mantine-"]')) {
      dom.mantine = 'mantine-* component classes';
    }
    if (q('.container-fluid, .row > [class*="col-md-"], .navbar-expand-lg, [data-bs-toggle]')) {
      dom.bootstrap = 'Bootstrap grid / data-bs-* attributes';
    }
    if (q('style[data-styled]')) {
      const ver = q('style[data-styled-version]')?.getAttribute('data-styled-version');
      dom.styled_components = ver ? `style[data-styled-version="${ver}"]` : 'style[data-styled]';
      if (ver) dom.styledComponentsVersion = ver;
    }
    if (hasEmotionAttr || q('style[data-emotion]')) {
      dom.emotion = 'style[data-emotion]';
    }

    // Website Builders & CMS
    if (htmlEl.hasAttribute('data-wf-site') || htmlEl.hasAttribute('data-wf-page')) {
      dom.webflow = `html[data-wf-site="${htmlEl.getAttribute('data-wf-site') || 'true'}"]`;
    }
    if (q('[data-framer-hydrate-v2], [data-framer-name], [data-framer-appear-id]')) {
      dom.framer = 'data-framer-* hydration markers';
    }
    if (q('link[href*="/wp-content/"], link[href*="/wp-includes/"], script[src*="/wp-includes/"]')) {
      dom.wordpress = '/wp-content/ or /wp-includes/ assets';
    }
    if (q('[id^="shopify-section-"], link[href*="cdn.shopify.com"], script[src*="cdn.shopify.com"]')) {
      dom.shopify = 'shopify-section-* / cdn.shopify.com';
    }
    if (q('#SITE_CONTAINER, [data-mesh-id], meta[name="generator"][content*="Wix"]')) {
      dom.wix = '#SITE_CONTAINER / Wix mesh layout';
    }
    if (q('[data-sqsp-block], link[href*="squarespace.com"]')) {
      dom.squarespace = 'Squarespace block attributes';
    }

    // Icon Systems
    if (q('svg.lucide, svg[class*="lucide-"]')) {
      dom.lucide = 'svg.lucide-* icons';
    }
    if (q('i[class*="fa-"], svg[class*="fa-"], link[href*="fontawesome"]')) {
      dom.fontawesome = 'fa-* icon classes';
    }
    if (q('.material-icons, .material-symbols-outlined, .material-symbols-rounded')) {
      dom.material_icons = '.material-icons / .material-symbols-*';
    }
    if (q('[class*="ph-"]')) {
      dom.phosphor_icons = 'ph-* icon classes';
    }
    if (q('i[class*="bi-"], svg.bi')) {
      dom.bootstrap_icons = 'bi-* icon classes';
    }

    return dom;
  }

  function collectScriptsAndLinks() {
    const scripts = [];
    const seenScripts = new Set();
    for (const s of Array.from(document.querySelectorAll('script'))) {
      if (s.src && !seenScripts.has(s.src)) {
        seenScripts.add(s.src);
        scripts.push({
          src: s.src,
          type: s.type || 'text/javascript',
          async: Boolean(s.async),
          defer: Boolean(s.defer),
          integrity: Boolean(s.integrity)
        });
      }
    }

    const links = [];
    const seenLinks = new Set();
    for (const l of Array.from(document.querySelectorAll('link[href]'))) {
      const key = `${l.rel}:${l.href}`;
      if (!seenLinks.has(key)) {
        seenLinks.add(key);
        links.push({
          rel: l.rel || '',
          href: l.href,
          as: l.getAttribute('as') || null
        });
      }
    }

    return {
      scripts: scripts.slice(0, 150),
      links: links.slice(0, 150)
    };
  }

  function collectMetaAndStructuredData() {
    const meta = Object.create(null);
    for (const m of Array.from(document.querySelectorAll('meta'))) {
      const key = (m.getAttribute('name') || m.getAttribute('property') || m.getAttribute('http-equiv') || '').toLowerCase().trim();
      const content = m.getAttribute('content');
      if (key && content && key !== '__proto__' && key !== 'constructor' && key !== 'prototype') {
        meta[key] = content.slice(0, 300);
      }
    }

    const jsonLdSchemas = [];
    for (const s of Array.from(document.querySelectorAll('script[type="application/ld+json"]'))) {
      try {
        const parsed = JSON.parse(s.textContent || '{}');
        const items = Array.isArray(parsed) ? parsed : (parsed['@graph'] ? parsed['@graph'] : [parsed]);
        for (const item of items) {
          if (item && item['@type']) {
            const t = Array.isArray(item['@type']) ? item['@type'].join(', ') : String(item['@type']);
            jsonLdSchemas.push(t);
          }
        }
      } catch {}
    }

    const hasImportMap = Boolean(document.querySelector('script[type="importmap"]'));
    const hasSpeculationRules = Boolean(document.querySelector('script[type="speculationrules"]'));
    const pwaManifestUrl = document.querySelector('link[rel="manifest"]')?.href || null;
    const canonicalUrl = document.querySelector('link[rel="canonical"]')?.href || null;

    return {
      title: document.title || '',
      meta,
      jsonLdSchemas: Array.from(new Set(jsonLdSchemas)).slice(0, 20),
      hasImportMap,
      hasSpeculationRules,
      pwaManifestUrl,
      canonicalUrl
    };
  }

  function collectDesignSystem() {
    const cssVarPrefixes = {
      tw: 0,
      shadcn: 0,
      radix: 0,
      bs: 0,
      chakra: 0,
      mui: 0,
      mantine: 0,
      ant: 0
    };
    const rootVariables = [];
    const shadcnCoreVars = new Set(['--background', '--foreground', '--primary', '--primary-foreground', '--muted', '--border', '--radius']);
    let shadcnMatched = 0;
    let tailwindVersion = null;
    let bootstrapVersion = null;
    let hasTwV3Var = false;
    let hasTwV4Var = false;

    try {
      for (const sheet of Array.from(document.styleSheets).slice(0, 25)) {
        let rules;
        try {
          rules = sheet.cssRules;
        } catch {
          continue; // Cross-origin stylesheet
        }
        if (!rules) continue;
        for (const rule of Array.from(rules).slice(0, 250)) {
          if (rule.cssText && rule.cssText.startsWith('@layer') && rule.cssText.includes('utilities') && rule.cssText.includes('theme')) {
            hasTwV4Var = true;
          }
          if (rule.style && (rule.selectorText === ':root' || rule.selectorText === 'html' || rule.selectorText === 'body' || rule.selectorText === '*, ::before, ::after' || rule.selectorText?.includes(':root'))) {
            for (let i = 0; i < rule.style.length; i++) {
              const prop = rule.style[i];
              if (prop.startsWith('--')) {
                if (prop.startsWith('--tw-')) {
                  cssVarPrefixes.tw++;
                  if (prop === '--tw-pan-x' || prop === '--tw-backdrop-blur' || prop === '--tw-numeric-spacing') {
                    hasTwV3Var = true;
                  }
                }
                if (prop === '--font-sans' || prop === '--color-slate-500' || prop === '--spacing') {
                  hasTwV4Var = true;
                }
                if (prop.startsWith('--radix-')) cssVarPrefixes.radix++;
                if (prop.startsWith('--bs-')) {
                  cssVarPrefixes.bs++;
                  if (prop === '--bs-body-bg-rgb' || prop === '--bs-emphasis-color') bootstrapVersion = '5.3+';
                  else if (!bootstrapVersion) bootstrapVersion = '5.x';
                }
                if (prop === '--breakpoint-md' && !bootstrapVersion) bootstrapVersion = '4.x';
                if (prop.startsWith('--chakra-')) cssVarPrefixes.chakra++;
                if (prop.startsWith('--mui-') || prop.startsWith('--Mu')) cssVarPrefixes.mui++;
                if (prop.startsWith('--mantine-')) cssVarPrefixes.mantine++;
                if (prop.startsWith('--ant-')) cssVarPrefixes.ant++;
                if (shadcnCoreVars.has(prop)) shadcnMatched++;

                if (rootVariables.length < 40 && !prop.startsWith('--tw-')) {
                  const val = rule.style.getPropertyValue(prop).trim();
                  if (val && val.length < 80) {
                    rootVariables.push({ name: prop, value: val });
                  }
                }
              }
            }
          }
        }
      }
    } catch {}

    if (hasTwV4Var && cssVarPrefixes.tw === 0) {
      tailwindVersion = '4.x';
    } else if (hasTwV3Var || cssVarPrefixes.tw > 0) {
      tailwindVersion = '3.x';
    }

    if (shadcnMatched >= 4) {
      cssVarPrefixes.shadcn = shadcnMatched;
    }

    // Sample computed colors across up to 18 unique landmarks for minimal layout cost
    const colorCounts = new Map();
    const rawLandmarks = [
      document.body,
      document.querySelector('header'),
      document.querySelector('nav'),
      document.querySelector('main'),
      document.querySelector('h1'),
      document.querySelector('p'),
      document.querySelector('a'),
      document.querySelector('button'),
      document.querySelector('footer'),
      ...Array.from(document.querySelectorAll('section, article, aside, button, a')).slice(0, 12)
    ];
    const landmarks = Array.from(new Set(rawLandmarks.filter(Boolean))).slice(0, 18);

    for (const el of landmarks) {
      try {
        const cs = window.getComputedStyle(el);
        const bg = rgbToHex(cs.backgroundColor);
        const fg = rgbToHex(cs.color);
        if (bg) colorCounts.set(bg, (colorCounts.get(bg) || 0) + 1);
        if (fg) colorCounts.set(fg, (colorCounts.get(fg) || 0) + 1);
      } catch {}
    }

    const palette = Array.from(colorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([hex, count]) => ({ hex, count }));

    // Typography inspection
    const getFontInfo = (el) => {
      if (!el) return null;
      try {
        const cs = window.getComputedStyle(el);
        return {
          family: cs.fontFamily.split(',')[0].replace(/^["']|["']$/g, '').trim(),
          fullStack: cs.fontFamily,
          size: cs.fontSize,
          weight: cs.fontWeight,
          lineHeight: cs.lineHeight
        };
      } catch {
        return null;
      }
    };

    const typography = {
      heading: getFontInfo(document.querySelector('h1') || document.querySelector('h2')),
      body: getFontInfo(document.body),
      code: getFontInfo(document.querySelector('code, pre'))
    };

    const htmlEl = document.documentElement;
    const darkMode = {
      htmlClassDark: htmlEl.classList.contains('dark') || Boolean(document.body?.classList.contains('dark')),
      dataTheme: htmlEl.getAttribute('data-theme') || htmlEl.getAttribute('data-color-mode') || document.body?.getAttribute('data-theme') || null,
      colorScheme: (() => {
        try {
          return window.getComputedStyle(htmlEl).colorScheme;
        } catch {
          return null;
        }
      })()
    };

    return {
      cssVarPrefixes,
      tailwindVersion,
      bootstrapVersion,
      rootVariables,
      palette,
      typography,
      darkMode,
      stylesheetCount: document.styleSheets.length
    };
  }

  async function collectFullPageSnapshot(reuseRecentProbe = false) {
    let mainProbe = latestMainProbe;
    if (!reuseRecentProbe || !mainProbe || (Date.now() - (mainProbe.timestamp || 0) > 5000)) {
      mainProbe = await requestFreshMainProbe();
    }
    const domSignals = collectDomSignals();
    const { scripts, links } = collectScriptsAndLinks();
    const metaAndSeo = collectMetaAndStructuredData();
    const designSystem = collectDesignSystem();

    return {
      url: window.location.href,
      origin: window.location.origin,
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      collectedAt: Date.now(),
      mainProbe,
      domSignals,
      scripts,
      links,
      metaAndSeo,
      designSystem
    };
  }

  // Listen for requests from background service worker or popup
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg && msg.type === 'DEEPSTACK_COLLECT_PAGE' && isCurrent()) {
      collectFullPageSnapshot(false)
        .then((snapshot) => sendResponse({ ok: true, snapshot }))
        .catch((err) => sendResponse({ ok: false, error: String(err) }));
      return true; // Async response
    }
  });

  // Proactively push snapshot to background worker during browser idle time
  const scheduleIdle = window.requestIdleCallback || ((cb) => setTimeout(cb, 500));
  scheduleIdle(() => {
    collectFullPageSnapshot(true)
      .then((snapshot) => {
        chrome.runtime.sendMessage({
          type: 'DEEPSTACK_PAGE_SNAPSHOT',
          snapshot
        }).catch(() => {});
      })
      .catch(() => {});
  }, { timeout: 1200 });
})();
