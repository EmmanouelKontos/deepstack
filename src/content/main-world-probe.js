/**
 * DeepStack Main-World Probe
 * Runs in the page's MAIN execution world to inspect window globals,
 * exact library versions, React Fiber trees, Next.js/Nuxt/Astro/Remix/Shopify internals,
 * stylesheet license headers, CDN semver URLs, and performance timing.
 */
(function () {
  function safeGet(fn, fallback = null) {
    try {
      const val = fn();
      return val === undefined ? fallback : val;
    } catch {
      return fallback;
    }
  }

  function inspectReactInternals() {
    const info = {
      detected: false,
      version: null,
      mode: null,
      devtoolsHook: false,
      fiberRootFound: false,
      serverComponents: false
    };

    try {
      if (window.React && window.React.version) {
        info.detected = true;
        info.version = String(window.React.version);
      }

      // Check React 19 vs React 18 internal object markers if global React is exposed
      if (window.React && !info.version) {
        if (window.React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE) {
          info.version = '19.x';
        } else if (window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
          info.version = '18.x / 17.x';
        }
      }

      const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (hook) {
        info.devtoolsHook = true;
        if (hook.renderers && typeof hook.renderers.forEach === 'function') {
          hook.renderers.forEach((renderer) => {
            if (renderer && renderer.version) {
              info.detected = true;
              info.version = String(renderer.version);
            }
            if (renderer && typeof renderer.bundleType === 'number') {
              info.bundleType = renderer.bundleType === 0 ? 'Production' : 'Development';
            }
          });
        }
      }

      // Walk DOM nodes to find React Fiber or Root container markers and infer React version
      const candidates = [
        document.getElementById('__next'),
        document.getElementById('root'),
        document.getElementById('app'),
        document.body,
        ...Array.from(document.body ? document.body.children : []).slice(0, 30)
      ].filter(Boolean);

      for (const el of candidates) {
        const keys = Object.keys(el);
        for (const k of keys) {
          if (k.startsWith('__reactContainer$') || k.startsWith('__reactFiber$') || k === '_reactRootContainer') {
            info.detected = true;
            info.fiberRootFound = true;
            const fiber = el[k];
            if (fiber && typeof fiber === 'object') {
              const rootTag = fiber.tag ?? fiber.current?.tag;
              if (rootTag === 1) {
                info.mode = 'Concurrent Root';
                if (!info.version) {
                  info.version = Array.isArray(window.__next_f) ? '18.3+ / 19.x' : '18.x+';
                }
              } else if (k === '_reactRootContainer') {
                info.mode = 'Legacy Root';
                if (!info.version) info.version = '16.x / 17.x';
              } else {
                info.mode = 'Fiber Root';
                if (!info.version && k.startsWith('__reactContainer$')) {
                  info.version = '17.x / 18.x';
                }
              }
            }
            break;
          }
        }
        if (info.fiberRootFound) break;
      }

      if (Array.isArray(window.__next_f)) {
        info.detected = true;
        info.serverComponents = true;
        info.mode = 'React Server Components (RSC Stream)';
        if (!info.version) info.version = '18.3+ / 19.x';
      }
    } catch {}

    return info;
  }

  function detectVueVersionFromDom() {
    try {
      if (window.Vue?.version) return String(window.Vue.version);
      const candidates = [
        document.getElementById('app'),
        document.getElementById('__nuxt'),
        document.querySelector('[data-v-app]'),
        document.body?.firstElementChild
      ].filter(Boolean);
      for (const el of candidates) {
        if (el.__vue_app__?.version) return String(el.__vue_app__.version);
        if (el.__vue__?.$options?._base?.version) return String(el.__vue__.$options._base.version);
        if (el.__vue__) return '2.x';
      }
    } catch {}
    return null;
  }

  function inspectFrameworkInternals() {
    const internals = {
      renderingStrategy: 'Client-Side / Static HTML',
      frameworks: {},
      bundler: null,
      hydrationNodes: 0
    };

    // 1. Next.js Deep Inspection
    const nextData = safeGet(() => window.__NEXT_DATA__);
    const nextF = safeGet(() => window.__next_f);
    const nextVersion = safeGet(() => window.next && window.next.version);

    if (nextData || Array.isArray(nextF) || nextVersion) {
      const isAppRouter = Array.isArray(nextF);
      let renderType = 'SSR / Hybrid';
      if (isAppRouter) {
        renderType = 'App Router (React Server Components + Streaming)';
      } else if (nextData) {
        if (nextData.gssp) renderType = 'Pages Router — SSR (getServerSideProps)';
        else if (nextData.gsp) renderType = 'Pages Router — SSG/ISR (getStaticProps)';
        else renderType = 'Pages Router — Automatic Static Optimization';
      }
      internals.renderingStrategy = renderType;
      internals.frameworks.nextjs = {
        version: nextVersion || (isAppRouter ? '13.4+ / 14.x / 15.x' : null),
        router: isAppRouter ? 'App Router (RSC)' : 'Pages Router',
        buildId: nextData?.buildId || null,
        page: nextData?.page || null,
        ssr: Boolean(nextData?.gssp || isAppRouter),
        ssg: Boolean(nextData?.gsp),
        isFallback: Boolean(nextData?.isFallback),
        rscPayloadChunks: isAppRouter ? nextF.length : 0,
        locale: nextData?.locale || null,
        locales: Array.isArray(nextData?.locales) ? nextData.locales : null,
        assetPrefix: nextData?.assetPrefix || null,
        runtimeConfigKeys: nextData?.runtimeConfig ? Object.keys(nextData.runtimeConfig) : []
      };
    }

    // 2. Nuxt Deep Inspection
    const nuxtData = safeGet(() => window.__NUXT__ || window.$nuxt);
    const vueVer = detectVueVersionFromDom();
    if (nuxtData) {
      const isSsr = Boolean(nuxtData.serverRendered);
      internals.renderingStrategy = isSsr ? 'Nuxt Universal SSR' : 'Nuxt SPA / Static';
      internals.frameworks.nuxt = {
        version: vueVer?.startsWith('3') ? '3.x' : (vueVer?.startsWith('2') ? '2.x' : null),
        serverRendered: isSsr,
        routePath: nuxtData.routePath || null,
        configKeys: nuxtData.config ? Object.keys(nuxtData.config) : [],
        stateKeys: nuxtData.state ? Object.keys(nuxtData.state) : []
      };
    }

    // 3. Vue.js Root Inspection
    if (vueVer) {
      internals.frameworks.vue = { version: vueVer };
    }

    // 4. Remix / React Router v7
    const remixCtx = safeGet(() => window.__remixContext || window.__reactRouterContext);
    const remixManifest = safeGet(() => window.__remixManifest || window.__reactRouterManifest);
    if (remixCtx || remixManifest) {
      internals.renderingStrategy = 'SSR with Nested Route Loaders (Remix / React Router)';
      internals.frameworks.remix = {
        version: remixManifest?.version || null,
        routeCount: remixManifest?.routes ? Object.keys(remixManifest.routes).length : 0,
        routes: remixManifest?.routes ? Object.keys(remixManifest.routes).slice(0, 12) : [],
        futureFlags: remixCtx?.future ? Object.keys(remixCtx.future).filter(k => remixCtx.future[k]) : []
      };
    }

    // 5. Astro Islands Inspection
    const astroIslands = safeGet(() => Array.from(document.querySelectorAll('astro-island')), []);
    if (astroIslands.length > 0) {
      internals.renderingStrategy = `Astro Islands Architecture (${astroIslands.length} hydrated islands)`;
      internals.hydrationNodes = astroIslands.length;
      const directives = {};
      const renderers = new Set();
      for (const isl of astroIslands) {
        const client = isl.getAttribute('client') || 'load';
        directives[client] = (directives[client] || 0) + 1;
        const r = isl.getAttribute('renderer-url');
        if (r) renderers.add(r.split('/').pop());
      }
      internals.frameworks.astro = {
        islandCount: astroIslands.length,
        hydrationDirectives: directives,
        renderers: Array.from(renderers)
      };
    }

    // 6. Angular Inspection
    const ngVerAttr = safeGet(() => document.querySelector('[ng-version]')?.getAttribute('ng-version'));
    if (ngVerAttr || safeGet(() => window.ng)) {
      internals.frameworks.angular = {
        version: ngVerAttr || null,
        ivyProbeAvailable: Boolean(safeGet(() => window.ng && window.ng.getComponent))
      };
    }

    // 7. Svelte / SvelteKit Inspection
    const svelteKitKeys = safeGet(() => Object.keys(window).filter(k => k.startsWith('__sveltekit_')), []);
    const svelteVer = safeGet(() => window.__svelte && window.__svelte.v ? Array.from(window.__svelte.v).join(', ') : null);
    if (svelteKitKeys.length > 0 || svelteVer) {
      if (svelteKitKeys.length > 0) {
        internals.renderingStrategy = 'SvelteKit SSR + Client Hydration';
      }
      internals.frameworks.svelte = {
        svelteKitRuntime: svelteKitKeys[0] || null,
        version: svelteVer ? `${svelteVer}.x` : null
      };
    }

    // 8. Qwik Inspection
    const qwikContainer = safeGet(() => document.querySelector('[q\\:container]'));
    if (qwikContainer) {
      internals.renderingStrategy = 'Qwik Resumable SSR (Zero Hydration)';
      internals.frameworks.qwik = {
        version: qwikContainer.getAttribute('q:version') || null,
        containerState: qwikContainer.getAttribute('q:container') || null
      };
    }

    // 9. Shopify Storefront Inspection
    const shopify = safeGet(() => window.Shopify);
    if (shopify && typeof shopify === 'object') {
      internals.frameworks.shopify = {
        shop: shopify.shop || null,
        themeName: shopify.theme?.name || null,
        themeId: shopify.theme?.id || null,
        themeStoreId: shopify.theme?.theme_store_id || null,
        currency: shopify.currency?.active || null,
        locale: shopify.locale || null,
        country: shopify.country || null
      };
    }

    // 10. Bundler Fingerprinting
    const winKeys = safeGet(() => Object.keys(window), []);
    const webpackChunks = winKeys.filter(k => k.startsWith('webpackChunk') || k.startsWith('webpackJsonp'));
    if (safeGet(() => window.TURBOPACK)) {
      internals.bundler = { name: 'Turbopack', details: 'window.TURBOPACK runtime active' };
    } else if (webpackChunks.length > 0 || safeGet(() => window.__webpack_require__)) {
      const chunkVar = webpackChunks[0] || '__webpack_require__';
      const isWebpack5 = chunkVar.startsWith('webpackChunk');
      const appName = chunkVar.replace(/^webpack(Chunk|Jsonp)/, '');
      const chunkArr = safeGet(() => window[chunkVar]);
      internals.bundler = {
        name: 'Webpack',
        version: isWebpack5 ? '5.x' : '4.x',
        chunkGlobal: chunkVar,
        appName: appName === '_N_E' ? 'Next.js Webpack' : (appName || 'default'),
        loadedChunkCount: Array.isArray(chunkArr) ? chunkArr.length : null
      };
    } else if (safeGet(() => window.__vite_plugin_react_preamble_installed__) || document.querySelector('script[src*="/@vite/"]')) {
      internals.bundler = { name: 'Vite', details: 'ESM native bundler detected' };
    } else if (safeGet(() => window.parcelRequire)) {
      internals.bundler = { name: 'Parcel', details: 'window.parcelRequire active' };
    }

    return internals;
  }

  function collectGlobalSignals(reactInfo, fwInternals) {
    const signals = {};
    const vueVer = fwInternals.frameworks?.vue?.version || null;
    const webpackVer = fwInternals.bundler?.name === 'Webpack' ? fwInternals.bundler.version : null;

    const probes = {
      // Frameworks & UI
      react: () => reactInfo.version || (reactInfo.detected ? true : null),
      nextjs: () => fwInternals.frameworks?.nextjs?.version || (window.__NEXT_DATA__ || Array.isArray(window.__next_f) ? true : null),
      vue: () => vueVer || (window.__VUE__ || window.__VUE_DEVTOOLS_GLOBAL_HOOK__ ? true : null),
      nuxt: () => fwInternals.frameworks?.nuxt?.version || ((window.__NUXT__ || window.$nuxt) ? true : null),
      angular: () => document.querySelector('[ng-version]')?.getAttribute('ng-version') || (window.ng ? true : null),
      angularjs: () => window.angular?.version?.full || null,
      svelte: () => fwInternals.frameworks?.svelte?.version || (window.__svelte ? true : null),
      sveltekit: () => Object.keys(window).some(k => k.startsWith('__sveltekit_')) ? true : null,
      remix: () => window.__remixManifest?.version || ((window.__remixContext || window.__remixManifest) ? true : null),
      astro: () => document.querySelector('astro-island') ? true : null,
      solidjs: () => window._$HY ? true : null,
      qwik: () => document.querySelector('[q\\:container]')?.getAttribute('q:version') || (document.querySelector('[q\\:container]') ? true : null),
      preact: () => window.preact ? true : null,
      alpinejs: () => window.Alpine?.version || (window.Alpine ? true : null),
      htmx: () => window.htmx?.version || (window.htmx ? true : null),
      lit: () => window.litElementVersions?.[0] || window.litHtmlVersions?.[0] || null,
      ember: () => window.Ember?.VERSION || null,
      backbone: () => window.Backbone?.VERSION || null,
      jquery: () => window.jQuery?.fn?.jquery || window.$?.fn?.jquery || null,
      jquery_ui: () => window.jQuery?.ui?.version || null,
      lodash: () => (typeof window._ === 'function' && window._.VERSION) ? String(window._.VERSION) : null,
      moment: () => window.moment?.version || null,
      axios: () => window.axios?.VERSION || null,
      zepto: () => window.Zepto ? true : null,

      // Backend Full-Stack Bridges (Livewire, Hotwire/Turbo, Phoenix LiveView, Blazor)
      laravel_livewire: () => window.Livewire ? (window.Livewire.version || true) : null,
      hotwire_turbo: () => window.Turbo ? true : null,
      phoenix_liveview: () => window.liveSocket ? true : null,
      blazor: () => window.Blazor ? true : null,

      // CSS Frameworks with JS Runtime
      bootstrap: () => window.bootstrap?.Tooltip?.VERSION || window.jQuery?.fn?.tooltip?.Constructor?.VERSION || null,

      // State & Data Fetching
      redux: () => (window.__REDUX_DEVTOOLS_EXTENSION__ || window.__REDUX_STATE__) ? true : null,
      apollo: () => window.__APOLLO_CLIENT__?.version || (window.__APOLLO_CLIENT__ || window.__APOLLO_STATE__ ? true : null),
      relay: () => window.__RELAY_DEVTOOLS_HOOK__ ? true : null,
      tanstack_query: () => window.__TANSTACK_QUERY_CLIENT__ ? true : null,
      mobx: () => window.__MOBX_DEVTOOLS_GLOBAL_HOOK__ ? true : null,
      pinia: () => window.__PINIA__ ? true : null,

      // Bundlers
      webpack: () => webpackVer || ((window.__webpack_require__ || Object.keys(window).some(k => k.startsWith('webpackChunk') || k.startsWith('webpackJsonp'))) ? true : null),
      turbopack: () => window.TURBOPACK ? true : null,
      vite: () => window.__vite_plugin_react_preamble_installed__ ? true : null,
      parcel: () => window.parcelRequire ? true : null,
      requirejs: () => window.requirejs ? (window.requirejs.version || true) : null,
      systemjs: () => window.System?.register ? true : null,

      // CMS & E-commerce
      shopify: () => window.Shopify ? (window.Shopify.theme?.name ? `Theme: ${window.Shopify.theme.name}` : true) : null,
      webflow: () => window.Webflow ? true : null,
      wix: () => (window.wixBiSession || window.rendererModel) ? true : null,
      squarespace: () => window.Static?.SQUARESPACE_CONTEXT ? true : null,
      wordpress: () => window.wp ? true : null,
      woocommerce: () => window.woocommerce_params ? true : null,
      magento: () => window.Mage ? true : null,
      drupal: () => window.Drupal ? true : null,
      ghost: () => window.ghost ? true : null,
      hubspot_cms: () => window.hsVars ? true : null,

      // Analytics & Tag Managers
      gtm: () => window.google_tag_manager ? true : null,
      ga4: () => (window.gtag || window.ga || window.GoogleAnalyticsObject) ? true : null,
      posthog: () => window.posthog ? (window.posthog.LIB_VERSION || true) : null,
      mixpanel: () => window.mixpanel ? (window.mixpanel.get_config?.('LIB_VERSION') || true) : null,
      amplitude: () => window.amplitude ? (window.amplitude.options?.version || true) : null,
      segment: () => window.analytics?.Integrations ? (window.analytics.VERSION || true) : null,
      plausible: () => window.plausible ? true : null,
      umami: () => window.umami ? true : null,
      hotjar: () => window.hj ? true : null,
      clarity: () => window.clarity ? true : null,
      fullstory: () => window.FS ? true : null,
      heap: () => window.heap ? true : null,
      optimizely: () => window.optimizely ? true : null,
      launchdarkly: () => window.LDClient ? true : null,

      // Monitoring & Observability
      sentry: () => window.__SENTRY__ ? (window.__SENTRY__.version || window.__SENTRY__.hub?._version || true) : null,
      datadog_rum: () => window.DD_RUM ? (window.DD_RUM.version || true) : null,
      logrocket: () => window.LogRocket ? true : null,
      newrelic: () => window.newrelic ? true : null,
      bugsnag: () => window.Bugsnag ? (window.Bugsnag._client?._notifier?.version || true) : null,
      rollbar: () => window.Rollbar ? true : null,

      // Auth & BaaS
      clerk: () => window.Clerk ? (window.Clerk.version || true) : null,
      auth0: () => window.auth0 ? (window.auth0.version || true) : null,
      firebase: () => window.firebase?.SDK_VERSION || (window.firebase ? true : null),
      supabase: () => window.supabase ? true : null,
      pusher: () => window.Pusher?.VERSION || (window.Pusher ? true : null),
      socketio: () => window.io?.protocol ? `${window.io.protocol}.x` : (window.io ? true : null),

      // Payments
      stripe: () => window.Stripe ? (window.Stripe.version ? String(window.Stripe.version) : true) : null,
      paypal: () => window.paypal?.version || (window.paypal || window.PayPal ? true : null),
      paddle: () => window.Paddle ? true : null,
      lemonsqueezy: () => window.LemonSqueezy ? true : null,
      braintree: () => window.braintree ? (window.braintree.VERSION || true) : null,

      // Customer Support & CRM
      intercom: () => window.Intercom ? true : null,
      crisp: () => window.$crisp ? true : null,
      zendesk: () => window.zE ? true : null,
      drift: () => window.drift ? true : null,
      hubspot: () => window._hsq ? true : null,
      klaviyo: () => window._learnq ? true : null,
      onesignal: () => window.OneSignal ? true : null,

      // Graphics, Animation, Charts & Maps
      threejs: () => window.THREE?.REVISION ? `0.${window.THREE.REVISION}.0` : (window.THREE ? true : null),
      pixijs: () => window.PIXI?.VERSION || (window.PIXI ? true : null),
      gsap: () => window.gsap?.version || window.TweenMax?.version || null,
      lottie: () => window.lottie?.version || (window.lottie || window.bodymovin ? true : null),
      d3: () => window.d3?.version || (window.d3 ? true : null),
      chartjs: () => window.Chart?.version || (window.Chart ? true : null),
      echarts: () => window.echarts?.version || null,
      highcharts: () => window.Highcharts?.version || null,
      mapbox: () => window.mapboxgl?.version || null,
      leaflet: () => window.L?.version || null,
      google_maps: () => window.google?.maps?.version || (window.google?.maps ? true : null),
      monaco: () => window.monaco?.editor ? true : null,
      codemirror: () => window.CodeMirror?.version || null,
      tinymce: () => window.tinymce ? `${window.tinymce.majorVersion}.${window.tinymce.minorVersion}` : null,
      pdfjs: () => window.pdfjsLib?.version || null,

      // Security & Consent
      turnstile: () => window.turnstile ? true : null,
      recaptcha: () => window.grecaptcha ? true : null,
      hcaptcha: () => window.hcaptcha ? true : null,
      onetrust: () => window.OneTrust ? true : null,
      cookiebot: () => window.Cookiebot ? (window.Cookiebot.version || true) : null,

      // CSS-in-JS
      styled_components: () => document.querySelector('style[data-styled-version]')?.getAttribute('data-styled-version') || (window.sc || document.querySelector('style[data-styled]') ? true : null),
      emotion: () => document.querySelector('style[data-emotion]') ? true : null
    };

    for (const [key, fn] of Object.entries(probes)) {
      const res = safeGet(fn, null);
      if (res !== null && res !== false) {
        signals[key] = res;
      }
    }

    return signals;
  }

  function collectPerformanceAndResources() {
    const navEntries = safeGet(() => performance.getEntriesByType('navigation'), []);
    const nav = navEntries[0] || {};
    const paintEntries = safeGet(() => performance.getEntriesByType('paint'), []);
    const fcpEntry = paintEntries.find(p => p.name === 'first-contentful-paint');
    const resources = safeGet(() => performance.getEntriesByType('resource'), []);

    const navigation = {
      protocol: nav.nextHopProtocol || null,
      transferSize: nav.transferSize || 0,
      encodedBodySize: nav.encodedBodySize || 0,
      decodedBodySize: nav.decodedBodySize || 0,
      ttfbMs: nav.responseStart && nav.requestStart ? Math.max(0, Math.round(nav.responseStart - nav.requestStart)) : null,
      fcpMs: fcpEntry ? Math.round(fcpEntry.startTime) : null,
      domInteractiveMs: nav.domInteractive ? Math.round(nav.domInteractive) : null,
      domCompleteMs: nav.domComplete ? Math.round(nav.domComplete) : null,
      redirectCount: nav.redirectCount || 0,
      type: nav.type || 'navigate',
      serverTiming: Array.isArray(nav.serverTiming)
        ? nav.serverTiming.map(s => ({ name: s.name, duration: Math.round(s.duration * 10) / 10, description: s.description }))
        : []
    };

    const resourceSummary = {
      totalCount: resources.length,
      totalTransferBytes: 0,
      protocols: {},
      byInitiator: {},
      urls: []
    };

    const seenUrls = new Set();
    for (const r of resources) {
      if (r.transferSize) resourceSummary.totalTransferBytes += r.transferSize;
      if (r.nextHopProtocol) {
        resourceSummary.protocols[r.nextHopProtocol] = (resourceSummary.protocols[r.nextHopProtocol] || 0) + 1;
      }
      const init = r.initiatorType || 'other';
      resourceSummary.byInitiator[init] = (resourceSummary.byInitiator[init] || 0) + 1;

      if (r.name && !seenUrls.has(r.name) && resourceSummary.urls.length < 300) {
        seenUrls.add(r.name);
        resourceSummary.urls.push({
          url: r.name,
          initiatorType: init,
          protocol: r.nextHopProtocol || null,
          durationMs: Math.round(r.duration || 0),
          transferSize: r.transferSize || 0
        });
      }
    }

    return { navigation, resourceSummary };
  }

  const withTimeout = (promise, fallback, ms = 400) =>
    Promise.race([Promise.resolve(promise).catch(() => fallback), new Promise((r) => setTimeout(() => r(fallback), ms))]);

  async function inspectServiceWorker() {
    const info = { active: false, scriptURL: null, scope: null, registrationsCount: 0 };
    if (!navigator.serviceWorker) return info;
    if (navigator.serviceWorker.controller) {
      info.active = true;
      info.scriptURL = navigator.serviceWorker.controller.scriptURL;
    }
    const regs = await withTimeout(navigator.serviceWorker.getRegistrations(), []);
    if (Array.isArray(regs) && regs.length > 0) {
      info.active = true;
      info.registrationsCount = regs.length;
      const sw = regs[0].active || regs[0].waiting || regs[0].installing;
      if (sw && !info.scriptURL) info.scriptURL = sw.scriptURL;
      info.scope = regs[0].scope || null;
    }
    return info;
  }

  async function listIndexedDbNames() {
    if (!window.indexedDB || typeof window.indexedDB.databases !== 'function') return [];
    const dbs = await withTimeout(window.indexedDB.databases(), []);
    return Array.isArray(dbs) ? dbs.map((d) => (d.name ? `${d.name} (v${d.version || 1})` : 'unnamed')).slice(0, 20) : [];
  }

  async function listCacheNames() {
    if (!window.caches || typeof window.caches.keys !== 'function') return [];
    const keys = await withTimeout(window.caches.keys(), []);
    return Array.isArray(keys) ? keys.slice(0, 20) : [];
  }

  function listLoadedFonts() {
    const fontSet = new Set();
    if (document.fonts && typeof document.fonts.forEach === 'function') {
      document.fonts.forEach((f) => {
        if (f && f.family && f.status === 'loaded') fontSet.add(f.family.replace(/^["']|["']$/g, '').trim());
      });
    }
    return Array.from(fontSet).slice(0, 25);
  }

  async function collectBrowserCapabilities() {
    // Key names only; storage values are never read.
    const [serviceWorker, indexedDbNames, cacheStorageNames] = await Promise.all([
      inspectServiceWorker().catch(() => ({ active: false, scriptURL: null, scope: null, registrationsCount: 0 })),
      listIndexedDbNames().catch(() => []),
      listCacheNames().catch(() => [])
    ]);
    return {
      serviceWorker,
      storage: {
        localStorageKeys: safeGet(() => Object.keys(window.localStorage).slice(0, 60), []),
        sessionStorageKeys: safeGet(() => Object.keys(window.sessionStorage).slice(0, 60), []),
        indexedDbNames,
        cacheStorageNames
      },
      fonts: safeGet(listLoadedFonts, [])
    };
  }

  async function runMainWorldProbe() {
    const react = inspectReactInternals();
    const frameworkInternals = inspectFrameworkInternals();
    const jsSignals = collectGlobalSignals(react, frameworkInternals);
    const perf = collectPerformanceAndResources();
    const capabilities = await collectBrowserCapabilities();

    const payload = {
      timestamp: Date.now(),
      react,
      frameworkInternals,
      jsSignals,
      perf,
      capabilities
    };

    try {
      const targetOrigin =
        window.location && typeof window.location.origin === 'string' && window.location.origin.startsWith('http')
          ? window.location.origin
          : '*';
      window.postMessage({ source: '__DEEPSTACK_MAIN_PROBE__', payload }, targetOrigin);
    } catch {}
    return payload;
  }

  // Guard against duplicate event listener attachment without exposing an enumerable window global
  const guardSymbol = Symbol.for('__deepstack_probe_listener__');
  if (!window[guardSymbol]) {
    try {
      Object.defineProperty(window, guardSymbol, { value: true, configurable: false, enumerable: false, writable: false });
    } catch {}
    window.addEventListener('__DEEPSTACK_REQUEST_MAIN_PROBE__', () => {
      runMainWorldProbe();
    });
  }

  runMainWorldProbe();
})();
