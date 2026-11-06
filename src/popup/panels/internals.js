import { chips, emptyLine, kvGrid, pluralize, sectionCard } from '../lib/dom.js';

/** App internals tab: rendering model, framework metadata, workers and browser storage. */

function frameworkCards(fw) {
  const f = fw.frameworks || {};
  const cards = [];

  if (f.nextjs) {
    const n = f.nextjs;
    const payload =
      n.rscPayloadChunks > 0
        ? `React Server Components (${n.rscPayloadChunks} stream chunks)`
        : n.ssr
          ? 'Server-side rendered per request'
          : n.ssg
            ? 'Pre-rendered at build time'
            : 'Automatic static optimization';
    cards.push(
      sectionCard({
        title: 'Next.js',
        badge: n.version ? `v${n.version}` : '',
        subtitle: 'Routing and rendering metadata the framework exposes to the browser.',
        body: kvGrid([
          ['Router', n.router],
          ['Build ID', n.buildId, { copy: n.buildId }],
          ['Route pattern', n.page, { copy: n.page }],
          ['Payload', payload, { mono: false }],
          ['Locale', n.locale],
          ['Locales', n.locales?.join(', ')]
        ])
      })
    );
  }

  if (f.nuxt) {
    cards.push(
      sectionCard({
        title: 'Nuxt',
        badge: f.nuxt.version ? `v${f.nuxt.version}` : '',
        subtitle: 'Server payload exposed by the Nuxt runtime.',
        body: kvGrid([
          ['Server rendered', f.nuxt.serverRendered ? 'Yes' : 'No'],
          ['Route', f.nuxt.routePath],
          ['Config keys', f.nuxt.configKeys?.slice(0, 8).join(', ')],
          ['State keys', f.nuxt.stateKeys?.slice(0, 8).join(', ')]
        ])
      })
    );
  }

  if (f.remix) {
    cards.push(
      sectionCard({
        title: 'Remix / React Router',
        badge: f.remix.routeCount ? pluralize(f.remix.routeCount, 'route') : '',
        subtitle: 'Route manifest shipped to the client.',
        body: chips(f.remix.routes || []) || emptyLine('No route manifest exposed.')
      })
    );
  }

  if (f.astro) {
    const directives = Object.entries(f.astro.hydrationDirectives || {}).map(([k, v]) => `client:${k} × ${v}`);
    cards.push(
      sectionCard({
        title: 'Astro islands',
        badge: pluralize(f.astro.islandCount, 'island'),
        subtitle: 'Static HTML with individually hydrated interactive components.',
        body: kvGrid([['Renderers', f.astro.renderers?.join(', ')]]) + chips(directives, { copy: false })
      })
    );
  }

  if (f.shopify) {
    const s = f.shopify;
    cards.push(
      sectionCard({
        title: 'Shopify storefront',
        subtitle: 'Store and theme configuration exposed on window.Shopify.',
        body: kvGrid([
          ['Store', s.shop, { copy: s.shop }],
          ['Theme', s.themeName ? `${s.themeName}${s.themeId ? ` (#${s.themeId})` : ''}` : null],
          ['Currency', s.currency ? `${s.currency}${s.country ? ` · ${s.country}` : ''}` : null],
          ['Locale', s.locale]
        ])
      })
    );
  }

  return cards;
}

export function renderInternalsPanel(report, container) {
  const react = report.internals?.react || {};
  const fw = report.internals?.frameworkInternals || {};
  const caps = report.internals?.capabilities || {};
  const sw = caps.serviceWorker || {};
  const storage = caps.storage || {};
  const ls = storage.localStorageKeys || [];
  const ss = storage.sessionStorageKeys || [];

  const sections = [
    sectionCard({
      title: 'Rendering & runtime',
      subtitle: 'How the browser receives and builds the interface.',
      body: kvGrid([
        ['Rendering', fw.renderingStrategy || 'Static HTML / client-side', { mono: false }],
        [
          'Bundler',
          fw.bundler
            ? `${fw.bundler.name}${fw.bundler.version ? ` ${fw.bundler.version}` : ''}${fw.bundler.loadedChunkCount ? ` · ${fw.bundler.loadedChunkCount} chunks` : ''}`
            : null
        ],
        ['React', react.detected ? `${react.version ? `v${react.version}` : 'Detected'}${react.mode ? ` · ${react.mode}` : ''}` : null],
        ['React build', react.bundleType || null]
      ])
    }),
    ...frameworkCards(fw),
    sectionCard({
      title: 'Workers & databases',
      subtitle: 'Background workers and client-side storage used for caching and offline state.',
      body: kvGrid([
        ['Service worker', sw.active ? sw.scriptURL || 'Registered' : 'None', { copy: sw.scriptURL || undefined }],
        ['Scope', sw.scope],
        ['IndexedDB', storage.indexedDbNames?.length ? storage.indexedDbNames.join(', ') : 'None'],
        ['Cache storage', storage.cacheStorageNames?.length ? storage.cacheStorageNames.join(', ') : 'None']
      ])
    }),
    sectionCard({
      title: 'Storage keys',
      badge: ls.length + ss.length,
      subtitle: 'Key names written by the page. DeepStack never reads the values.',
      body:
        ls.length + ss.length > 0
          ? chips([
              ...ls.slice(0, 40).map((k) => ({ label: k, title: 'localStorage' })),
              ...ss.slice(0, 20).map((k) => ({ label: k, title: 'sessionStorage', tone: 'muted' }))
            ])
          : emptyLine('This page has not stored anything in localStorage or sessionStorage.')
    })
  ];

  container.innerHTML = sections.join('');
}
