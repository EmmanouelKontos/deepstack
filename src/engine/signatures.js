/**
 * DeepStack Multi-Vector Technology Signatures Database
 * Every category and signature includes plain-English descriptions
 * and semantic icon keys (rendered as crisp inline SVGs in the UI).
 */

export const CATEGORIES = {
  SSR_META: {
    id: 'SSR_META',
    label: 'App Frameworks & SSR',
    iconKey: 'layers',
    description: 'Full-stack frameworks handling routing, server rendering, and page builds',
    order: 1
  },
  FRAMEWORK: {
    id: 'FRAMEWORK',
    label: 'UI Libraries & Frontend',
    iconKey: 'code',
    description: 'Core JavaScript libraries that render the interactive user interface',
    order: 2
  },
  CSS_UI: {
    id: 'CSS_UI',
    label: 'Styling & Component Systems',
    iconKey: 'palette',
    description: 'CSS frameworks, UI primitives, and design system libraries',
    order: 3
  },
  STATE_DATA: {
    id: 'STATE_DATA',
    label: 'Data Fetching & State',
    iconKey: 'database',
    description: 'Client state managers, API query caches, and GraphQL/RPC clients',
    order: 4
  },
  BUNDLER: {
    id: 'BUNDLER',
    label: 'Build Tools & Compilers',
    iconKey: 'box',
    description: 'JavaScript bundlers, module compilers, and type systems',
    order: 5
  },
  CMS_ECOMM: {
    id: 'CMS_ECOMM',
    label: 'CMS, Commerce & Builders',
    iconKey: 'shopping-bag',
    description: 'Content management systems, visual site builders, and e-commerce platforms',
    order: 6
  },
  CDN_EDGE: {
    id: 'CDN_EDGE',
    label: 'Cloud Hosting & CDN Edge',
    iconKey: 'globe',
    description: 'Cloud platforms, edge networks, and content delivery infrastructure',
    order: 7
  },
  BACKEND: {
    id: 'BACKEND',
    label: 'Backend Runtime & Languages',
    iconKey: 'cpu',
    description: 'Server-side programming languages and application frameworks',
    order: 8
  },
  SERVER: {
    id: 'SERVER',
    label: 'Web Servers & Proxies',
    iconKey: 'server',
    description: 'HTTP web servers, reverse proxies, and load balancers',
    order: 9
  },
  AUTH: {
    id: 'AUTH',
    label: 'Authentication & Identity',
    iconKey: 'key',
    description: 'User login, session management, and single sign-on (SSO) providers',
    order: 10
  },
  BAAS_DB: {
    id: 'BAAS_DB',
    label: 'Backend Services, Search & Realtime',
    iconKey: 'cloud',
    description: 'Managed databases, realtime WebSockets, and hosted search engines',
    order: 11
  },
  AI_AGENTS: {
    id: 'AI_AGENTS',
    label: 'AI Assistants & LLM SDKs',
    iconKey: 'sparkles',
    description: 'AI chat widgets, documentation copilots, and generative AI integrations',
    order: 12
  },
  PAYMENTS: {
    id: 'PAYMENTS',
    label: 'Payments & Billing',
    iconKey: 'credit-card',
    description: 'Payment gateways, subscription billing, and checkout processors',
    order: 13
  },
  ANALYTICS: {
    id: 'ANALYTICS',
    label: 'Product Analytics & A/B Testing',
    iconKey: 'bar-chart',
    description: 'Traffic analytics, session replay, feature flags, and experimentation',
    order: 14
  },
  ADS_PIXELS: {
    id: 'ADS_PIXELS',
    label: 'Advertising & Conversion Pixels',
    iconKey: 'target',
    description: 'Ad networks, conversion tracking pixels, and retargeting scripts',
    order: 15
  },
  OBSERVABILITY: {
    id: 'OBSERVABILITY',
    label: 'Error Tracking & Monitoring',
    iconKey: 'activity',
    description: 'Crash reporting, real-user monitoring (RUM), and performance telemetry',
    order: 16
  },
  SUPPORT_CRM: {
    id: 'SUPPORT_CRM',
    label: 'Customer Support & Marketing',
    iconKey: 'message-square',
    description: 'Live chat widgets, helpdesks, CRM tools, and marketing automation',
    order: 17
  },
  GRAPHICS_MEDIA: {
    id: 'GRAPHICS_MEDIA',
    label: 'Graphics, Video, Maps & Editors',
    iconKey: 'film',
    description: '3D/WebGL engines, animation libraries, interactive maps, and media players',
    order: 18
  },
  SECURITY: {
    id: 'SECURITY',
    label: 'Bot Protection & Privacy Consent',
    iconKey: 'shield',
    description: 'CAPTCHAs, WAF/bot mitigation, and GDPR cookie consent banners',
    order: 19
  },
  FONTS_ICONS: {
    id: 'FONTS_ICONS',
    label: 'Typography & Iconography',
    iconKey: 'type',
    description: 'Web font delivery networks and SVG icon libraries',
    order: 20
  },
  WEB_STANDARDS: {
    id: 'WEB_STANDARDS',
    label: 'Modern Web Platform & Protocols',
    iconKey: 'compass',
    description: 'Next-gen HTTP transport protocols, PWA capabilities, and browser APIs',
    order: 21
  }
};

export const SIGNATURES = [
  // ==========================================
  // 1. META-FRAMEWORKS & SSR
  // ==========================================
  {
    id: 'nextjs',
    name: 'Next.js',
    category: 'SSR_META',
    description: 'Full-stack React framework with server rendering, routing, and React Server Components',
    website: 'https://nextjs.org',
    js: 'nextjs',
    dom: 'nextjs',
    headers: {
      'x-powered-by': 'Next\\.js\\s*([\\d.]+)?',
      'x-nextjs-cache': '.*',
      'x-nextjs-matched-path': '.*'
    },
    scripts: ['/_next/static/'],
    cookies: ['^__next_preview_data$', '^__prerender_bypass$'],
    implies: ['react', 'nodejs']
  },
  {
    id: 'nuxt',
    name: 'Nuxt',
    category: 'SSR_META',
    description: 'Full-stack Vue.js framework for server-rendered and static web applications',
    website: 'https://nuxt.com',
    js: 'nuxt',
    dom: 'nuxt',
    headers: { 'x-powered-by': 'Nuxt' },
    scripts: ['/_nuxt/'],
    implies: ['vue', 'nodejs']
  },
  {
    id: 'remix',
    name: 'Remix / React Router v7',
    category: 'SSR_META',
    description: 'Full-stack React framework focused on nested routing and progressive enhancement',
    website: 'https://remix.run',
    js: 'remix',
    headers: { 'x-remix-response': '.*' },
    scripts: ['/build/root-[a-z0-9]+\\.js', '/assets/manifest-[a-z0-9]+\\.js'],
    implies: ['react', 'nodejs']
  },
  {
    id: 'astro',
    name: 'Astro',
    category: 'SSR_META',
    description: 'Content-focused web framework using Islands Architecture for minimal client JS',
    website: 'https://astro.build',
    js: 'astro',
    dom: 'astro',
    meta: { generator: '^Astro\\s*v?([\\d.]+)?' },
    scripts: ['/_astro/']
  },
  {
    id: 'sveltekit',
    name: 'SvelteKit',
    category: 'SSR_META',
    description: 'Official application framework for Svelte with server rendering and routing',
    website: 'https://kit.svelte.dev',
    js: 'sveltekit',
    scripts: ['/_app/immutable/'],
    implies: ['svelte', 'nodejs']
  },
  {
    id: 'gatsby',
    name: 'Gatsby',
    category: 'SSR_META',
    description: 'React-based static site generator with a GraphQL data layer',
    website: 'https://www.gatsbyjs.com',
    meta: { generator: '^Gatsby\\s*([\\d.]+)?' },
    scripts: ['/commons-[a-f0-9]+\\.js', '/webpack-runtime-[a-f0-9]+\\.js'],
    implies: ['react', 'webpack']
  },
  {
    id: 'qwik',
    name: 'Qwik',
    category: 'SSR_META',
    description: 'Resumable web framework that executes JavaScript lazily on interaction without hydration',
    website: 'https://qwik.dev',
    js: 'qwik',
    dom: 'qwik'
  },

  // ==========================================
  // 2. FRONTEND FRAMEWORKS & UI LIBRARIES
  // ==========================================
  {
    id: 'react',
    name: 'React',
    category: 'FRAMEWORK',
    description: 'Component-based JavaScript library for building interactive user interfaces',
    website: 'https://react.dev',
    js: 'react',
    dom: 'react',
    scripts: [
      'react(?:\\.production\\.min|\\.development)?\\.js',
      '/react@([\\d.]+)/'
    ]
  },
  {
    id: 'vue',
    name: 'Vue.js',
    category: 'FRAMEWORK',
    description: 'Progressive JavaScript framework for reactive user interfaces',
    website: 'https://vuejs.org',
    js: 'vue',
    dom: 'vue',
    scripts: [
      'vue(?:\\.runtime)?(?:\\.global)?(?:\\.prod)?\\.js',
      '/vue@([\\d.]+)/'
    ]
  },
  {
    id: 'angular',
    name: 'Angular',
    category: 'FRAMEWORK',
    description: 'Enterprise TypeScript application framework maintained by Google',
    website: 'https://angular.dev',
    js: 'angular',
    dom: 'angular',
    scripts: ['main\\.[a-f0-9]+\\.js', 'polyfills\\.[a-f0-9]+\\.js'],
    implies: ['typescript']
  },
  {
    id: 'angularjs',
    name: 'AngularJS (Legacy 1.x)',
    category: 'FRAMEWORK',
    description: 'First-generation AngularJS 1.x MVC frontend framework',
    website: 'https://angularjs.org',
    js: 'angularjs',
    scripts: ['angular(?:\\.min)?\\.js']
  },
  {
    id: 'svelte',
    name: 'Svelte',
    category: 'FRAMEWORK',
    description: 'Compiler-first UI framework that generates minimal vanilla JavaScript without a virtual DOM',
    website: 'https://svelte.dev',
    js: 'svelte',
    dom: 'svelte'
  },
  {
    id: 'solidjs',
    name: 'SolidJS',
    category: 'FRAMEWORK',
    description: 'Fine-grained reactive UI library compiling JSX directly to DOM updates',
    website: 'https://www.solidjs.com',
    js: 'solidjs'
  },
  {
    id: 'preact',
    name: 'Preact',
    category: 'FRAMEWORK',
    description: 'Lightweight 3KB alternative to React with the same modern API',
    website: 'https://preactjs.com',
    js: 'preact',
    scripts: ['/preact(?:@([\\d.]+))?/']
  },
  {
    id: 'htmx',
    name: 'htmx',
    category: 'FRAMEWORK',
    description: 'Library enabling AJAX, WebSockets, and Server-Sent Events directly via HTML attributes',
    website: 'https://htmx.org',
    js: 'htmx',
    dom: 'htmx',
    scripts: ['htmx(?:\\.min)?\\.js', 'htmx\\.org@([\\d.]+)']
  },
  {
    id: 'alpinejs',
    name: 'Alpine.js',
    category: 'FRAMEWORK',
    description: 'Lightweight reactive directives written directly inside HTML markup',
    website: 'https://alpinejs.dev',
    js: 'alpinejs',
    dom: 'alpinejs',
    scripts: ['alpinejs@([\\d.]+)', 'alpine(?:\\.min)?\\.js']
  },
  {
    id: 'lit',
    name: 'Lit (Web Components)',
    category: 'FRAMEWORK',
    description: 'Google library for building fast, standard Web Components with Shadow DOM',
    website: 'https://lit.dev',
    js: 'lit'
  },
  {
    id: 'ember',
    name: 'Ember.js',
    category: 'FRAMEWORK',
    description: 'Batteries-included JavaScript framework for ambitious web applications',
    website: 'https://emberjs.com',
    js: 'ember'
  },
  {
    id: 'backbone',
    name: 'Backbone.js',
    category: 'FRAMEWORK',
    description: 'Classic lightweight MVC library providing models, views, and collections',
    website: 'https://backbonejs.org',
    js: 'backbone',
    scripts: ['backbone(?:-min|\\.min)?\\.js']
  },
  {
    id: 'jquery',
    name: 'jQuery',
    category: 'FRAMEWORK',
    description: 'DOM manipulation, event handling, and AJAX utility library',
    website: 'https://jquery.com',
    js: 'jquery',
    scripts: [
      'jquery(?:-([\\d.]+))?(?:\\.min|\\.slim)?\\.js',
      '/jquery/([\\d.]+)/jquery',
      'jquery\\.min\\.js\\?ver=([\\d.]+)'
    ]
  },
  {
    id: 'jquery_ui',
    name: 'jQuery UI',
    category: 'FRAMEWORK',
    description: 'User interface interactions, effects, and widgets built on top of jQuery',
    website: 'https://jqueryui.com',
    js: 'jquery_ui',
    scripts: ['jquery-ui(?:-([\\d.]+))?(?:\\.custom)?(?:\\.min)?\\.js'],
    implies: ['jquery']
  },
  {
    id: 'lodash',
    name: 'Lodash / Underscore',
    category: 'FRAMEWORK',
    description: 'JavaScript utility library delivering modularity, performance, and array/object helpers',
    website: 'https://lodash.com',
    js: 'lodash',
    scripts: ['lodash(?:\\.min)?\\.js', '/lodash@([\\d.]+)/']
  },
  {
    id: 'moment',
    name: 'Moment.js',
    category: 'FRAMEWORK',
    description: 'Date and time parsing, validation, manipulation, and formatting library',
    website: 'https://momentjs.com',
    js: 'moment',
    scripts: ['moment(?:\\.min)?\\.js', '/moment@([\\d.]+)/']
  },
  {
    id: 'axios',
    name: 'Axios',
    category: 'STATE_DATA',
    description: 'Promise-based HTTP client for the browser and Node.js',
    website: 'https://axios-http.com',
    js: 'axios',
    scripts: ['axios(?:\\.min)?\\.js', '/axios@([\\d.]+)/']
  },
  {
    id: 'zepto',
    name: 'Zepto.js',
    category: 'FRAMEWORK',
    description: 'Minimalist jQuery-compatible JavaScript library',
    website: 'https://zeptojs.com',
    js: 'zepto'
  },

  // ==========================================
  // 3. STATE MANAGEMENT & DATA FETCHING
  // ==========================================
  {
    id: 'redux',
    name: 'Redux',
    category: 'STATE_DATA',
    description: 'Predictable global state container for JavaScript applications',
    website: 'https://redux.js.org',
    js: 'redux',
    storage: ['^persist:root$']
  },
  {
    id: 'tanstack_query',
    name: 'TanStack Query (React Query)',
    category: 'STATE_DATA',
    description: 'Async state management, caching, and data synchronization library',
    website: 'https://tanstack.com/query',
    js: 'tanstack_query',
    storage: ['REACT_QUERY_OFFLINE_CACHE']
  },
  {
    id: 'apollo',
    name: 'Apollo Client',
    category: 'STATE_DATA',
    description: 'GraphQL client with normalized caching and reactive UI bindings',
    website: 'https://www.apollographql.com',
    js: 'apollo',
    implies: ['graphql']
  },
  {
    id: 'relay',
    name: 'Relay',
    category: 'STATE_DATA',
    description: 'Meta’s compiler-driven GraphQL client for React applications',
    website: 'https://relay.dev',
    js: 'relay',
    implies: ['react', 'graphql']
  },
  {
    id: 'trpc',
    name: 'tRPC',
    category: 'STATE_DATA',
    description: 'End-to-end typesafe API layer between TypeScript backend and frontend',
    website: 'https://trpc.io',
    network: ['/api/trpc/', '\\.trpc\\.'],
    implies: ['typescript']
  },
  {
    id: 'mobx',
    name: 'MobX',
    category: 'STATE_DATA',
    description: 'Observable reactive state management library',
    website: 'https://mobx.js.org',
    js: 'mobx'
  },
  {
    id: 'pinia',
    name: 'Pinia',
    category: 'STATE_DATA',
    description: 'Official intuitive state management store for Vue.js',
    website: 'https://pinia.vuejs.org',
    js: 'pinia',
    implies: ['vue']
  },
  {
    id: 'graphql',
    name: 'GraphQL API',
    category: 'STATE_DATA',
    description: 'Declarative query language for APIs allowing clients to request exact data shapes',
    website: 'https://graphql.org',
    network: ['/graphql(?:\\?|$|/)', 'graphql\\.[a-z0-9-]+\\.[a-z]+']
  },

  // ==========================================
  // 4. CSS FRAMEWORKS & DESIGN SYSTEMS
  // ==========================================
  {
    id: 'tailwindcss',
    name: 'Tailwind CSS',
    category: 'CSS_UI',
    description: 'Utility-first CSS framework for composing custom designs directly in markup',
    website: 'https://tailwindcss.com',
    dom: 'tailwindcss',
    cssVar: 'tw',
    scripts: ['cdn\\.tailwindcss\\.com']
  },
  {
    id: 'shadcn_ui',
    name: 'shadcn/ui',
    category: 'CSS_UI',
    description: 'Accessible component collection built on Radix UI primitives and Tailwind CSS tokens',
    website: 'https://ui.shadcn.com',
    cssVar: 'shadcn',
    implies: ['tailwindcss', 'radix_ui']
  },
  {
    id: 'radix_ui',
    name: 'Radix UI',
    category: 'CSS_UI',
    description: 'Unstyled, accessible UI component primitives for React',
    website: 'https://www.radix-ui.com',
    dom: 'radix_ui',
    cssVar: 'radix',
    implies: ['react']
  },
  {
    id: 'mui',
    name: 'Material UI (MUI)',
    category: 'CSS_UI',
    description: 'Comprehensive React component library implementing Google Material Design',
    website: 'https://mui.com',
    dom: 'mui',
    cssVar: 'mui',
    implies: ['react']
  },
  {
    id: 'chakra_ui',
    name: 'Chakra UI',
    category: 'CSS_UI',
    description: 'Modular and accessible component library for React applications',
    website: 'https://chakra-ui.com',
    dom: 'chakra_ui',
    cssVar: 'chakra',
    storage: ['^chakra-ui-color-mode$'],
    implies: ['react']
  },
  {
    id: 'ant_design',
    name: 'Ant Design',
    category: 'CSS_UI',
    description: 'Enterprise-class React UI design language and component library',
    website: 'https://ant.design',
    dom: 'ant_design',
    cssVar: 'ant'
  },
  {
    id: 'mantine',
    name: 'Mantine',
    category: 'CSS_UI',
    description: 'Full-featured React components and hooks library with native dark mode support',
    website: 'https://mantine.dev',
    dom: 'mantine',
    cssVar: 'mantine',
    implies: ['react']
  },
  {
    id: 'bootstrap',
    name: 'Bootstrap',
    category: 'CSS_UI',
    description: 'Responsive CSS grid and pre-styled UI component toolkit',
    website: 'https://getbootstrap.com',
    js: 'bootstrap',
    dom: 'bootstrap',
    cssVar: 'bs',
    scripts: [
      'bootstrap(?:/|@|-)([\\d.]+)',
      'bootstrap(?:\\.bundle)?(?:\\.min)?\\.js'
    ],
    links: [
      'bootstrap(?:/|@|-)([\\d.]+)',
      'bootstrap(?:\\.min)?\\.css'
    ]
  },
  {
    id: 'styled_components',
    name: 'styled-components',
    category: 'CSS_UI',
    description: 'CSS-in-JS library using tagged template literals to style React components',
    website: 'https://styled-components.com',
    js: 'styled_components',
    dom: 'styled_components',
    implies: ['react']
  },
  {
    id: 'emotion',
    name: 'Emotion CSS',
    category: 'CSS_UI',
    description: 'High-performance CSS-in-JS runtime and styling library',
    website: 'https://emotion.sh',
    js: 'emotion',
    dom: 'emotion'
  },

  // ==========================================
  // 5. BUILD TOOLS & BUNDLERS
  // ==========================================
  {
    id: 'webpack',
    name: 'Webpack',
    category: 'BUNDLER',
    description: 'Module bundler that compiles JavaScript chunks and static assets',
    website: 'https://webpack.js.org',
    js: 'webpack'
  },
  {
    id: 'turbopack',
    name: 'Turbopack',
    category: 'BUNDLER',
    description: 'Rust-powered incremental bundler built for Next.js and modern web apps',
    website: 'https://turbo.build/pack',
    js: 'turbopack'
  },
  {
    id: 'vite',
    name: 'Vite',
    category: 'BUNDLER',
    description: 'Next-generation frontend build tool using native ES modules and Rollup',
    website: 'https://vitejs.dev',
    js: 'vite',
    scripts: ['/@vite/client', '/assets/index-[a-zA-Z0-9_-]{8}\\.js']
  },
  {
    id: 'parcel',
    name: 'Parcel',
    category: 'BUNDLER',
    description: 'Zero-configuration web application bundler',
    website: 'https://parceljs.org',
    js: 'parcel'
  },
  {
    id: 'requirejs',
    name: 'RequireJS',
    category: 'BUNDLER',
    description: 'Asynchronous Module Definition (AMD) JavaScript file and module loader',
    website: 'https://requirejs.org',
    js: 'requirejs',
    scripts: ['require(?:\\.min)?\\.js']
  },
  {
    id: 'systemjs',
    name: 'SystemJS',
    category: 'BUNDLER',
    description: 'Dynamic ES module loader for browser workflows and micro-frontends',
    website: 'https://github.com/systemjs/systemjs',
    js: 'systemjs'
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    category: 'BUNDLER',
    description: 'Statically typed superset of JavaScript that compiles to clean JS',
    website: 'https://www.typescriptlang.org'
  },

  // ==========================================
  // 6. BACKEND & RUNTIME
  // ==========================================
  {
    id: 'nodejs',
    name: 'Node.js',
    category: 'BACKEND',
    description: 'Server-side JavaScript runtime built on Chrome’s V8 engine',
    website: 'https://nodejs.org',
    headers: {
      'x-powered-by': 'Express|Next\\.js|Nuxt|Fastify|NestJS|Koa'
    }
  },
  {
    id: 'express',
    name: 'Express.js',
    category: 'BACKEND',
    description: 'Minimalist HTTP server and routing framework for Node.js',
    website: 'https://expressjs.com',
    headers: {
      'x-powered-by': '^Express$',
      'etag': '^W/"[0-9a-f]+-[A-Za-z0-9+/=]{27}"$'
    },
    cookies: ['^connect\\.sid$'],
    implies: ['nodejs']
  },
  {
    id: 'php',
    name: 'PHP',
    category: 'BACKEND',
    description: 'Server-side scripting language powering WordPress, Laravel, and Drupal',
    website: 'https://www.php.net',
    headers: {
      'x-powered-by': 'PHP/?([\\d.]+)?',
      'server': 'PHP/?([\\d.]+)?'
    },
    cookies: ['^PHPSESSID$']
  },
  {
    id: 'laravel',
    name: 'Laravel',
    category: 'BACKEND',
    description: 'Full-stack PHP web application framework with expressive syntax',
    website: 'https://laravel.com',
    cookies: ['^laravel_session$', '^XSRF-TOKEN$'],
    implies: ['php']
  },
  {
    id: 'laravel_livewire',
    name: 'Laravel Livewire',
    category: 'BACKEND',
    description: 'Full-stack reactive framework for Laravel that renders dynamic interfaces on the server',
    website: 'https://livewire.laravel.com',
    js: 'laravel_livewire',
    dom: 'laravel_livewire',
    scripts: ['/livewire/livewire(?:\\.min)?\\.js(?:\\?id=([a-f0-9]+))?'],
    implies: ['laravel', 'php']
  },
  {
    id: 'codeigniter',
    name: 'CodeIgniter',
    category: 'BACKEND',
    description: 'Lightweight MVC PHP framework',
    website: 'https://codeigniter.com',
    cookies: ['^ci_session$'],
    implies: ['php']
  },
  {
    id: 'craft_cms',
    name: 'Craft CMS (Yii PHP)',
    category: 'CMS_ECOMM',
    description: 'Flexible content-first PHP CMS built on the Yii framework',
    website: 'https://craftcms.com',
    headers: { 'x-powered-by': 'Craft CMS' },
    cookies: ['^CraftSessionId$', '^CRAFT_CSRF_TOKEN$'],
    implies: ['php']
  },
  {
    id: 'symfony',
    name: 'Symfony',
    category: 'BACKEND',
    description: 'Modular PHP framework for enterprise web applications',
    website: 'https://symfony.com',
    headers: { 'x-debug-token': '.*' },
    cookies: ['^sf_redirect$'],
    implies: ['php']
  },
  {
    id: 'python',
    name: 'Python',
    category: 'BACKEND',
    description: 'High-level programming language used for web backends, APIs, and AI',
    website: 'https://www.python.org',
    headers: {
      'server': 'Python/?([\\d.]+)?|WSGIServer/?([\\d.]+)?|gunicorn/?([\\d.]+)?|uvicorn|Werkzeug/?([\\d.]+)?'
    }
  },
  {
    id: 'django',
    name: 'Django',
    category: 'BACKEND',
    description: 'High-level Python web framework with built-in ORM, auth, and admin',
    website: 'https://www.djangoproject.com',
    dom: 'django',
    headers: { 'server': 'WSGIServer/?([\\d.]+)?' },
    cookies: ['^csrftoken$', '^django_language$', '^sessionid$'],
    implies: ['python']
  },
  {
    id: 'flask',
    name: 'Flask / Werkzeug',
    category: 'BACKEND',
    description: 'Lightweight WSGI Python web application framework',
    website: 'https://flask.palletsprojects.com',
    headers: { 'server': 'Werkzeug/?([\\d.]+)?' },
    implies: ['python']
  },
  {
    id: 'fastapi',
    name: 'FastAPI / Uvicorn',
    category: 'BACKEND',
    description: 'High-performance async Python API framework running on ASGI/Uvicorn',
    website: 'https://fastapi.tiangolo.com',
    headers: { 'server': 'uvicorn' },
    implies: ['python']
  },
  {
    id: 'rails',
    name: 'Ruby on Rails',
    category: 'BACKEND',
    description: 'Full-stack convention-over-configuration web framework written in Ruby',
    website: 'https://rubyonrails.org',
    headers: {
      'x-powered-by': 'Phusion Passenger',
      'x-runtime': '^[\\d.]+$'
    },
    meta: { 'csrf-param': '^authenticity_token$' },
    cookies: ['^_.*_session$'],
    implies: ['ruby']
  },
  {
    id: 'hotwire_turbo',
    name: 'Hotwire / Turbo',
    category: 'BACKEND',
    description: 'HTML-over-the-wire framework from 37signals for fast server-rendered Rails apps',
    website: 'https://hotwired.dev',
    js: 'hotwire_turbo',
    dom: 'hotwire_turbo',
    implies: ['rails', 'ruby']
  },
  {
    id: 'ruby',
    name: 'Ruby',
    category: 'BACKEND',
    description: 'Dynamic object-oriented programming language powering Rails applications',
    website: 'https://www.ruby-lang.org',
    headers: { 'server': 'Puma/?([\\d.]+)?|Unicorn|WEBrick/?([\\d.]+)?|Phusion Passenger/?([\\d.]+)?' }
  },
  {
    id: 'aspnet',
    name: 'ASP.NET / .NET',
    category: 'BACKEND',
    description: 'Microsoft’s server-side web application framework',
    website: 'https://dotnet.microsoft.com',
    dom: 'aspnet',
    headers: {
      'x-powered-by': 'ASP\\.NET',
      'x-aspnet-version': '([\\d.]+)',
      'x-aspnetmvc-version': '([\\d.]+)',
      'server': 'Kestrel'
    },
    cookies: ['^ASP\\.NET_SessionId$', '^\\.AspNetCore\\.']
  },
  {
    id: 'blazor',
    name: 'Blazor (.NET)',
    category: 'BACKEND',
    description: 'Microsoft .NET framework for interactive server or WebAssembly client web UI',
    website: 'https://dotnet.microsoft.com/apps/aspnet/web-apps/blazor',
    js: 'blazor',
    dom: 'blazor',
    scripts: ['_framework/blazor\\.(?:webassembly|server|web)\\.js'],
    implies: ['aspnet']
  },
  {
    id: 'spring_boot',
    name: 'Spring Boot / Spring',
    category: 'BACKEND',
    description: 'Enterprise Java application framework for microservices and web backends',
    website: 'https://spring.io/projects/spring-boot',
    headers: { 'x-application-context': '.*' },
    cookies: ['^JSESSIONID$'],
    implies: ['java']
  },
  {
    id: 'java',
    name: 'Java / JVM',
    category: 'BACKEND',
    description: 'Enterprise JVM backend runtime (Spring Boot, Jakarta EE, Servlets)',
    website: 'https://www.java.com',
    headers: {
      'x-powered-by': 'Servlet/?([\\d.]+)?|JSP/?([\\d.]+)?|JSF|Spring',
      'server': 'Apache-Coyote/?([\\d.]+)?|Jetty\\(([\\d.]+)\\)|WildFly'
    },
    cookies: ['^JSESSIONID$']
  },
  {
    id: 'golang',
    name: 'Go (Golang)',
    category: 'BACKEND',
    description: 'Compiled, statically typed systems and backend language developed at Google',
    website: 'https://go.dev',
    cookies: ['^gosessionid$', '^beegosessionID$']
  },
  {
    id: 'elixir_phoenix',
    name: 'Phoenix (Elixir)',
    category: 'BACKEND',
    description: 'Concurrent, fault-tolerant web framework built on Elixir and the Erlang VM',
    website: 'https://www.phoenixframework.org',
    headers: { 'server': 'Cowboy' },
    cookies: ['^_.*_key$']
  },
  {
    id: 'phoenix_liveview',
    name: 'Phoenix LiveView',
    category: 'BACKEND',
    description: 'Real-time server-rendered HTML over WebSockets powered by Elixir and Phoenix',
    website: 'https://hexdocs.pm/phoenix_live_view',
    js: 'phoenix_liveview',
    dom: 'phoenix_liveview',
    implies: ['elixir_phoenix']
  },

  // ==========================================
  // 7. CMS & E-COMMERCE
  // ==========================================
  {
    id: 'wordpress',
    name: 'WordPress',
    category: 'CMS_ECOMM',
    description: 'Open-source PHP content management system and publishing platform',
    website: 'https://wordpress.org',
    js: 'wordpress',
    dom: 'wordpress',
    meta: { generator: '^WordPress\\s*([\\d.]+)?' },
    headers: { 'x-pingback': '/xmlrpc\\.php$', 'link': 'rel="https://api\\.w\\.org/"' },
    scripts: [
      'wp-emoji-release\\.min\\.js\\?ver=([\\d.]+)',
      '/wp-includes/.*[?&]ver=([\\d.]+)',
      '/wp-content/'
    ],
    links: ['/wp-includes/css/dist/block-library/style(?:\\.min)?\\.css\\?ver=([\\d.]+)'],
    cookies: ['^wp-settings-', '^wordpress_logged_in_'],
    implies: ['php']
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    category: 'CMS_ECOMM',
    description: 'E-commerce plugin and checkout engine for WordPress',
    website: 'https://woocommerce.com',
    js: 'woocommerce',
    meta: { generator: '^WooCommerce\\s*([\\d.]+)?' },
    scripts: [
      '/plugins/woocommerce/assets/.*[?&]ver=([\\d.]+)',
      '/plugins/woocommerce/'
    ],
    cookies: ['^woocommerce_cart_hash$', '^woocommerce_items_in_cart$'],
    implies: ['wordpress', 'php']
  },
  {
    id: 'shopify',
    name: 'Shopify',
    category: 'CMS_ECOMM',
    description: 'Hosted e-commerce platform for online stores and retail point-of-sale',
    website: 'https://www.shopify.com',
    js: 'shopify',
    dom: 'shopify',
    headers: {
      'x-shopid': '.*',
      'x-shardid': '.*',
      'powered-by': 'Shopify'
    },
    cookies: ['^_shopify_s$', '^_shopify_y$', '^_orig_referrer$'],
    scripts: ['cdn\\.shopify\\.com']
  },
  {
    id: 'webflow',
    name: 'Webflow',
    category: 'CMS_ECOMM',
    description: 'Visual web design, CMS, and hosting platform',
    website: 'https://webflow.com',
    js: 'webflow',
    dom: 'webflow',
    meta: { generator: '^Webflow$' },
    scripts: ['website-files\\.com.*/js/webflow']
  },
  {
    id: 'framer',
    name: 'Framer',
    category: 'CMS_ECOMM',
    description: 'Interactive visual site builder powered by React and Framer Motion',
    website: 'https://www.framer.com',
    dom: 'framer',
    scripts: ['framerusercontent\\.com'],
    implies: ['react']
  },
  {
    id: 'wix',
    name: 'Wix',
    category: 'CMS_ECOMM',
    description: 'Cloud-based website builder and business management platform',
    website: 'https://www.wix.com',
    js: 'wix',
    dom: 'wix',
    meta: { generator: 'Wix\\.com' },
    headers: { 'x-wix-request-id': '.*' },
    scripts: ['static\\.parastorage\\.com']
  },
  {
    id: 'squarespace',
    name: 'Squarespace',
    category: 'CMS_ECOMM',
    description: 'All-in-one website builder, blogging platform, and online store host',
    website: 'https://www.squarespace.com',
    js: 'squarespace',
    dom: 'squarespace',
    headers: { 'server': 'Squarespace' },
    cookies: ['^crumb$'],
    scripts: ['static1\\.squarespace\\.com']
  },
  {
    id: 'ghost',
    name: 'Ghost',
    category: 'CMS_ECOMM',
    description: 'Node.js publishing, newsletter, and membership platform',
    website: 'https://ghost.org',
    js: 'ghost',
    meta: { generator: '^Ghost\\s*([\\d.]+)?' },
    headers: { 'x-cache-invalidate': '.*' },
    implies: ['nodejs']
  },
  {
    id: 'drupal',
    name: 'Drupal',
    category: 'CMS_ECOMM',
    description: 'Enterprise open-source PHP content management framework',
    website: 'https://www.drupal.org',
    js: 'drupal',
    meta: { generator: '^Drupal\\s*([\\d.]+)?' },
    headers: {
      'x-drupal-cache': '.*',
      'x-generator': '^Drupal\\s*([\\d.]+)?'
    },
    implies: ['php']
  },
  {
    id: 'magento',
    name: 'Magento (Adobe Commerce)',
    category: 'CMS_ECOMM',
    description: 'Enterprise PHP e-commerce platform by Adobe',
    website: 'https://business.adobe.com/products/magento/magento-commerce.html',
    js: 'magento',
    cookies: ['^mage-cache-sessid$', '^mage-messages$'],
    implies: ['php']
  },
  {
    id: 'contentful',
    name: 'Contentful',
    category: 'CMS_ECOMM',
    description: 'API-first headless CMS for multi-channel digital content',
    website: 'https://www.contentful.com',
    network: ['ctfassets\\.net', 'contentful\\.com']
  },
  {
    id: 'sanity',
    name: 'Sanity',
    category: 'CMS_ECOMM',
    description: 'Composable content cloud and real-time headless CMS',
    website: 'https://www.sanity.io',
    network: ['cdn\\.sanity\\.io', 'api\\.sanity\\.io']
  },
  {
    id: 'storyblok',
    name: 'Storyblok',
    category: 'CMS_ECOMM',
    description: 'Headless CMS featuring a real-time visual editor',
    website: 'https://www.storyblok.com',
    network: ['a\\.storyblok\\.com', 'api\\.storyblok\\.com']
  },
  {
    id: 'prismic',
    name: 'Prismic',
    category: 'CMS_ECOMM',
    description: 'Headless page builder CMS for Next.js, Nuxt, and SvelteKit',
    website: 'https://prismic.io',
    network: ['prismic\\.io', 'cdn\\.prismic\\.io']
  },
  {
    id: 'hubspot_cms',
    name: 'HubSpot CMS Hub',
    category: 'CMS_ECOMM',
    description: 'Content management system integrated directly with HubSpot CRM',
    website: 'https://www.hubspot.com/products/cms',
    js: 'hubspot_cms',
    headers: { 'x-hs-content-group-id': '.*', 'x-powered-by': 'HubSpot' }
  },

  // ==========================================
  // 8. CDN, EDGE & HOSTING / PAAS
  // ==========================================
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    category: 'CDN_EDGE',
    description: 'Global edge network, CDN, DNS, DDoS mitigation, and serverless Workers',
    website: 'https://www.cloudflare.com',
    headers: {
      'server': '^cloudflare$',
      'cf-ray': '.*',
      'cf-cache-status': '.*'
    },
    cookies: ['^__cf_bm$', '^cf_clearance$']
  },
  {
    id: 'vercel',
    name: 'Vercel',
    category: 'CDN_EDGE',
    description: 'Frontend cloud platform for serverless deployment and global edge caching',
    website: 'https://vercel.com',
    headers: {
      'server': '^Vercel$',
      'x-vercel-id': '.*',
      'x-vercel-cache': '.*'
    }
  },
  {
    id: 'netlify',
    name: 'Netlify',
    category: 'CDN_EDGE',
    description: 'Cloud web hosting platform with edge functions and automated Git deploys',
    website: 'https://www.netlify.com',
    headers: {
      'server': '^Netlify$',
      'x-nf-request-id': '.*'
    }
  },
  {
    id: 'aws_cloudfront',
    name: 'AWS CloudFront',
    category: 'CDN_EDGE',
    description: 'Amazon Web Services global content delivery network (CDN)',
    website: 'https://aws.amazon.com/cloudfront/',
    headers: {
      'via': 'CloudFront',
      'x-amz-cf-id': '.*',
      'x-amz-cf-pop': '.*'
    }
  },
  {
    id: 'aws_s3',
    name: 'Amazon S3',
    category: 'CDN_EDGE',
    description: 'AWS cloud object storage serving static assets, media, or site bundles',
    website: 'https://aws.amazon.com/s3/',
    headers: {
      'server': '^AmazonS3$',
      'x-amz-request-id': '.*'
    },
    network: ['s3[.-][a-z0-9-]*\\.amazonaws\\.com']
  },
  {
    id: 'fastly',
    name: 'Fastly',
    category: 'CDN_EDGE',
    description: 'Programmable edge cloud and low-latency content delivery network',
    website: 'https://www.fastly.com',
    headers: {
      'x-served-by': 'cache-',
      'x-fastly-request-id': '.*',
      'fastly-restarts': '.*'
    }
  },
  {
    id: 'akamai',
    name: 'Akamai',
    category: 'CDN_EDGE',
    description: 'Enterprise global content delivery network and edge security provider',
    website: 'https://www.akamai.com',
    headers: {
      'x-akamai-transformed': '.*',
      'server': 'AkamaiGHost'
    },
    cookies: ['^akaalb_', '^bm_sz$']
  },
  {
    id: 'google_cloud',
    name: 'Google Cloud / GFE',
    category: 'CDN_EDGE',
    description: 'Google Cloud Platform load balancing, Cloud CDN, and Cloud Storage',
    website: 'https://cloud.google.com',
    headers: {
      'via': 'google',
      'server': 'Google Frontend|gws|ESF|sffe',
      'x-cloud-trace-context': '.*'
    },
    network: ['storage\\.googleapis\\.com']
  },
  {
    id: 'github_pages',
    name: 'GitHub Pages',
    category: 'CDN_EDGE',
    description: 'Static site hosting served directly from a GitHub repository',
    website: 'https://pages.github.com',
    headers: {
      'server': '^GitHub\\.com$',
      'x-github-request-id': '.*'
    }
  },
  {
    id: 'fly_io',
    name: 'Fly.io',
    category: 'CDN_EDGE',
    description: 'Global application cloud running full-stack MicroVMs close to users',
    website: 'https://fly.io',
    headers: {
      'server': '^Fly/',
      'fly-request-id': '.*'
    }
  },
  {
    id: 'render',
    name: 'Render',
    category: 'CDN_EDGE',
    description: 'Unified cloud platform for hosting web services, APIs, and databases',
    website: 'https://render.com',
    headers: { 'x-render-origin-server': '.*' }
  },
  {
    id: 'railway',
    name: 'Railway',
    category: 'CDN_EDGE',
    description: 'Cloud infrastructure platform for deploying full-stack apps and databases',
    website: 'https://railway.app',
    headers: { 'server': 'railway' }
  },
  {
    id: 'heroku',
    name: 'Heroku',
    category: 'CDN_EDGE',
    description: 'Container-based cloud Platform-as-a-Service (PaaS)',
    website: 'https://www.heroku.com',
    headers: { 'via': 'vegur' }
  },
  {
    id: 'bunny_cdn',
    name: 'Bunny CDN',
    category: 'CDN_EDGE',
    description: 'High-speed global content delivery network and edge storage',
    website: 'https://bunny.net',
    headers: { 'server': '^BunnyCDN-' },
    network: ['\\.b-cdn\\.net']
  },

  // ==========================================
  // 9. WEB SERVERS & PROXIES
  // ==========================================
  {
    id: 'nginx',
    name: 'Nginx',
    category: 'SERVER',
    description: 'High-performance HTTP web server, reverse proxy, and load balancer',
    website: 'https://nginx.org',
    headers: { 'server': '^nginx(?:/([\\d.]+))?' }
  },
  {
    id: 'apache',
    name: 'Apache HTTP Server',
    category: 'SERVER',
    description: 'Open-source cross-platform web server software',
    website: 'https://httpd.apache.org',
    headers: { 'server': '^Apache(?:/([\\d.]+))?' }
  },
  {
    id: 'envoy',
    name: 'Envoy Proxy',
    category: 'SERVER',
    description: 'Cloud-native high-performance edge and service proxy',
    website: 'https://www.envoyproxy.io',
    headers: {
      'server': '^envoy$',
      'x-envoy-upstream-service-time': '.*'
    }
  },
  {
    id: 'caddy',
    name: 'Caddy',
    category: 'SERVER',
    description: 'Modern Go web server with automatic HTTPS provisioning',
    website: 'https://caddyserver.com',
    headers: { 'server': '^Caddy$' }
  },
  {
    id: 'litespeed',
    name: 'LiteSpeed Web Server',
    category: 'SERVER',
    description: 'High-performance drop-in Apache replacement with built-in page caching',
    website: 'https://www.litespeedtech.com',
    headers: {
      'server': '^LiteSpeed$',
      'x-litespeed-cache': '.*'
    }
  },
  {
    id: 'iis',
    name: 'Microsoft IIS',
    category: 'SERVER',
    description: 'Internet Information Services web server for Windows Server',
    website: 'https://www.iis.net',
    headers: { 'server': 'Microsoft-IIS(?:/([\\d.]+))?' }
  },
  {
    id: 'varnish',
    name: 'Varnish Cache',
    category: 'SERVER',
    description: 'Reverse caching HTTP proxy that accelerates content delivery',
    website: 'https://varnish-cache.org',
    headers: {
      'via': 'varnish',
      'x-varnish': '.*'
    }
  },
  {
    id: 'openresty',
    name: 'OpenResty',
    category: 'SERVER',
    description: 'Web platform extending Nginx with LuaJIT for programmable edge routing',
    website: 'https://openresty.org',
    headers: { 'server': 'openresty(?:/([\\d.]+))?' }
  },

  // ==========================================
  // 10. AUTHENTICATION & IDENTITY
  // ==========================================
  {
    id: 'clerk',
    name: 'Clerk',
    category: 'AUTH',
    description: 'Complete user management, authentication, and multi-factor login platform',
    website: 'https://clerk.com',
    js: 'clerk',
    cookies: ['^__clerk_', '^__client_uat$'],
    network: ['clerk\\.[a-z0-9-]+\\.[a-z]+', 'clerk\\.accounts\\.dev']
  },
  {
    id: 'auth0',
    name: 'Auth0 (Okta)',
    category: 'AUTH',
    description: 'Identity platform for OAuth2 login, SSO, and user management',
    website: 'https://auth0.com',
    js: 'auth0',
    cookies: ['^auth0', '^a0:'],
    network: ['\\.auth0\\.com']
  },
  {
    id: 'nextauth',
    name: 'Auth.js (NextAuth)',
    category: 'AUTH',
    description: 'Open-source authentication library for Next.js and modern web frameworks',
    website: 'https://authjs.dev',
    cookies: [
      '^(?:__Secure-|__Host-)?next-auth\\.session-token$',
      '^(?:__Secure-|__Host-)?next-auth\\.csrf-token$',
      '^(?:__Secure-|__Host-)?authjs\\.session-token$'
    ],
    network: ['/api/auth/session']
  },
  {
    id: 'okta',
    name: 'Okta Workforce / CIAM',
    category: 'AUTH',
    description: 'Enterprise single sign-on (SSO) and identity management provider',
    website: 'https://www.okta.com',
    network: ['\\.okta\\.com', '\\.oktapreview\\.com']
  },
  {
    id: 'cognito',
    name: 'AWS Cognito',
    category: 'AUTH',
    description: 'Amazon Web Services user identity and access management service',
    website: 'https://aws.amazon.com/cognito/',
    storage: ['^CognitoIdentityServiceProvider\\.'],
    network: ['cognito-idp\\.[a-z0-9-]+\\.amazonaws\\.com']
  },

  // ==========================================
  // 11. BAAS, DATABASES, SEARCH & REALTIME
  // ==========================================
  {
    id: 'supabase',
    name: 'Supabase',
    category: 'BAAS_DB',
    description: 'Open-source Postgres Backend-as-a-Service with Auth, Realtime, and Storage',
    website: 'https://supabase.com',
    js: 'supabase',
    storage: ['^sb-.*-auth-token$', '^supabase\\.auth\\.token$'],
    network: ['\\.supabase\\.co', '\\.supabase\\.in']
  },
  {
    id: 'firebase',
    name: 'Google Firebase',
    category: 'BAAS_DB',
    description: 'Google app development platform providing Firestore, Realtime DB, and Auth',
    website: 'https://firebase.google.com',
    js: 'firebase',
    storage: ['^firebase:authUser:', '^firebase:host:'],
    scripts: ['firebase(?:-[a-z]+)?\\.js', 'gstatic\\.com/firebasejs/([\\d.]+)/'],
    network: ['firebaseio\\.com', 'firestore\\.googleapis\\.com', 'identitytoolkit\\.googleapis\\.com']
  },
  {
    id: 'convex',
    name: 'Convex',
    category: 'BAAS_DB',
    description: 'Reactive backend-as-a-service with real-time TypeScript database queries',
    website: 'https://www.convex.dev',
    network: ['\\.convex\\.cloud', '\\.convex\\.site']
  },
  {
    id: 'appwrite',
    name: 'Appwrite',
    category: 'BAAS_DB',
    description: 'Open-source backend server for auth, databases, functions, and storage',
    website: 'https://appwrite.io',
    network: ['\\.appwrite\\.io']
  },
  {
    id: 'algolia',
    name: 'Algolia Search',
    category: 'BAAS_DB',
    description: 'Hosted instant search and discovery API engine',
    website: 'https://www.algolia.com',
    network: ['\\.algolia\\.net', '\\.algolianet\\.com']
  },
  {
    id: 'pusher',
    name: 'Pusher Channels',
    category: 'BAAS_DB',
    description: 'Hosted WebSockets service for real-time notifications and live updates',
    website: 'https://pusher.com',
    js: 'pusher',
    network: ['\\.pusher\\.com', '\\.pusherapp\\.com']
  },
  {
    id: 'socketio',
    name: 'Socket.IO',
    category: 'BAAS_DB',
    description: 'Bidirectional event-based real-time communication library',
    website: 'https://socket.io',
    js: 'socketio',
    scripts: ['socket\\.io(?:\\.min)?\\.js'],
    network: ['/socket\\.io/\\?EIO=']
  },

  // ==========================================
  // 12. AI ASSISTANTS & LLM SDKS
  // ==========================================
  {
    id: 'kapa_ai',
    name: 'Kapa.ai',
    category: 'AI_AGENTS',
    description: 'Technical AI documentation assistant and developer Q&A widget',
    website: 'https://www.kapa.ai',
    scripts: ['widget\\.kapa\\.ai'],
    network: ['api\\.kapa\\.ai', 'widget\\.kapa\\.ai']
  },
  {
    id: 'voiceflow',
    name: 'Voiceflow AI Agent',
    category: 'AI_AGENTS',
    description: 'Conversational AI assistant and customer support agent widget',
    website: 'https://www.voiceflow.com',
    scripts: ['cdn\\.voiceflow\\.com'],
    network: ['general-runtime\\.voiceflow\\.com']
  },
  {
    id: 'botpress',
    name: 'Botpress AI',
    category: 'AI_AGENTS',
    description: 'LLM-powered chatbot and conversational AI webchat widget',
    website: 'https://botpress.com',
    scripts: ['cdn\\.botpress\\.cloud'],
    network: ['messaging\\.botpress\\.cloud']
  },
  {
    id: 'elevenlabs_convai',
    name: 'ElevenLabs Conversational AI',
    category: 'AI_AGENTS',
    description: 'Real-time voice AI agent widget powered by ElevenLabs speech synthesis',
    website: 'https://elevenlabs.io',
    scripts: ['elevenlabs\\.io/convai-widget'],
    network: ['api\\.elevenlabs\\.io']
  },
  {
    id: 'ada_cx',
    name: 'Ada AI Customer Service',
    category: 'AI_AGENTS',
    description: 'Automated enterprise AI customer service agent',
    website: 'https://www.ada.cx',
    scripts: ['static\\.ada\\.support']
  },

  // ==========================================
  // 13. ANALYTICS, TAG MANAGERS & EXPERIMENTATION
  // ==========================================
  {
    id: 'gtm',
    name: 'Google Tag Manager',
    category: 'ANALYTICS',
    description: 'Tag management system that loads marketing and analytics scripts dynamically',
    website: 'https://tagmanager.google.com',
    js: 'gtm',
    scripts: ['googletagmanager\\.com/gtm\\.js']
  },
  {
    id: 'ga4',
    name: 'Google Analytics (GA4)',
    category: 'ANALYTICS',
    description: 'Google’s web traffic and user behavior analytics service',
    website: 'https://analytics.google.com',
    js: 'ga4',
    cookies: ['^_ga$', '^_ga_[A-Z0-9]+$', '^_gid$'],
    scripts: ['googletagmanager\\.com/gtag/js', 'google-analytics\\.com/analytics\\.js'],
    network: ['google-analytics\\.com/g/collect']
  },
  {
    id: 'posthog',
    name: 'PostHog',
    category: 'ANALYTICS',
    description: 'Product analytics, session replay, feature flags, and A/B testing suite',
    website: 'https://posthog.com',
    js: 'posthog',
    storage: ['^ph_.*_posthog$'],
    network: ['\\.posthog\\.com', 'us\\.i\\.posthog\\.com', 'eu\\.i\\.posthog\\.com']
  },
  {
    id: 'mixpanel',
    name: 'Mixpanel',
    category: 'ANALYTICS',
    description: 'Event-based product analytics for tracking user funnels and retention',
    website: 'https://mixpanel.com',
    js: 'mixpanel',
    cookies: ['^mp_.*_mixpanel$'],
    network: ['api(?:-js)?\\.mixpanel\\.com']
  },
  {
    id: 'amplitude',
    name: 'Amplitude',
    category: 'ANALYTICS',
    description: 'Digital product analytics and behavioral experimentation platform',
    website: 'https://amplitude.com',
    js: 'amplitude',
    cookies: ['^AMP_'],
    storage: ['^AMP_'],
    network: ['api2?\\.amplitude\\.com', 'cdn\\.amplitude\\.com']
  },
  {
    id: 'segment',
    name: 'Twilio Segment',
    category: 'ANALYTICS',
    description: 'Customer Data Platform (CDP) routing analytics events to downstream tools',
    website: 'https://segment.com',
    js: 'segment',
    cookies: ['^ajs_anonymous_id$', '^ajs_user_id$'],
    storage: ['^ajs_user_traits$'],
    network: ['cdn\\.segment\\.com', 'api\\.segment\\.io']
  },
  {
    id: 'plausible',
    name: 'Plausible Analytics',
    category: 'ANALYTICS',
    description: 'Privacy-friendly, cookie-free web analytics alternative to Google Analytics',
    website: 'https://plausible.io',
    js: 'plausible',
    scripts: ['plausible\\.io/js/']
  },
  {
    id: 'umami',
    name: 'Umami Analytics',
    category: 'ANALYTICS',
    description: 'Open-source, privacy-focused web analytics solution',
    website: 'https://umami.is',
    js: 'umami',
    scripts: ['umami\\.is/script\\.js']
  },
  {
    id: 'vercel_analytics',
    name: 'Vercel Web Analytics',
    category: 'ANALYTICS',
    description: 'Privacy-friendly real-user traffic and Core Web Vitals telemetry on Vercel',
    website: 'https://vercel.com/analytics',
    scripts: ['/_vercel/insights/script\\.js', '/_vercel/speed-insights/script\\.js'],
    network: ['/_vercel/insights/']
  },
  {
    id: 'hotjar',
    name: 'Hotjar',
    category: 'ANALYTICS',
    description: 'Heatmaps, user session recordings, and on-site feedback polls',
    website: 'https://www.hotjar.com',
    js: 'hotjar',
    cookies: ['^_hjSession'],
    scripts: ['static\\.hotjar\\.com']
  },
  {
    id: 'clarity',
    name: 'Microsoft Clarity',
    category: 'ANALYTICS',
    description: 'Session replay and interaction heatmap tool by Microsoft',
    website: 'https://clarity.microsoft.com',
    js: 'clarity',
    cookies: ['^_clck$', '^_clsk$'],
    scripts: ['clarity\\.ms/tag/']
  },
  {
    id: 'fullstory',
    name: 'FullStory',
    category: 'ANALYTICS',
    description: 'Digital experience intelligence and session replay platform',
    website: 'https://www.fullstory.com',
    js: 'fullstory',
    scripts: ['edge\\.fullstory\\.com']
  },
  {
    id: 'heap',
    name: 'Heap Analytics',
    category: 'ANALYTICS',
    description: 'Autocapture product analytics that records all user interactions',
    website: 'https://www.heap.io',
    js: 'heap',
    scripts: ['cdn\\.heapanalytics\\.com']
  },
  {
    id: 'launchdarkly',
    name: 'LaunchDarkly',
    category: 'ANALYTICS',
    description: 'Enterprise feature flag management and progressive rollout platform',
    website: 'https://launchdarkly.com',
    js: 'launchdarkly',
    network: ['\\.launchdarkly\\.com']
  },
  {
    id: 'optimizely',
    name: 'Optimizely',
    category: 'ANALYTICS',
    description: 'A/B testing, multivariate experimentation, and personalization platform',
    website: 'https://www.optimizely.com',
    js: 'optimizely',
    scripts: ['cdn\\.optimizely\\.com']
  },
  {
    id: 'statsig',
    name: 'Statsig',
    category: 'ANALYTICS',
    description: 'Feature gates, experimentation, and product analytics platform',
    website: 'https://www.statsig.com',
    storage: ['^STATSIG_LOCAL_STORAGE_'],
    network: ['\\.statsigapi\\.net', 'featureassets\\.org']
  },

  // ==========================================
  // 14. ADVERTISING & CONVERSION PIXELS
  // ==========================================
  {
    id: 'meta_pixel',
    name: 'Meta Pixel (Facebook)',
    category: 'ADS_PIXELS',
    description: 'Conversion tracking and retargeting pixel for Facebook and Instagram ads',
    website: 'https://www.facebook.com/business/tools/meta-pixel',
    cookies: ['^_fbp$', '^_fbc$'],
    scripts: ['connect\\.facebook\\.net/.*/fbevents\\.js']
  },
  {
    id: 'linkedin_insight',
    name: 'LinkedIn Insight Tag',
    category: 'ADS_PIXELS',
    description: 'B2B conversion tracking and website demographics tag for LinkedIn Ads',
    website: 'https://business.linkedin.com/marketing-solutions/insight-tag',
    scripts: ['snap\\.licdn\\.com/li\\.lms-analytics/']
  },
  {
    id: 'tiktok_pixel',
    name: 'TikTok Pixel',
    category: 'ADS_PIXELS',
    description: 'Ad conversion and audience attribution script for TikTok campaigns',
    website: 'https://ads.tiktok.com',
    cookies: ['^_ttp$'],
    scripts: ['analytics\\.tiktok\\.com/i18n/pixel/']
  },
  {
    id: 'google_ads',
    name: 'Google Ads Conversion Tracking',
    category: 'ADS_PIXELS',
    description: 'Remarketing and ad conversion measurement for Google Ads',
    website: 'https://ads.google.com',
    cookies: ['^_gcl_au$'],
    scripts: ['googleadservices\\.com/pagead/conversion']
  },
  {
    id: 'reddit_pixel',
    name: 'Reddit Pixel',
    category: 'ADS_PIXELS',
    description: 'Conversion attribution script for Reddit advertising',
    website: 'https://www.redditinc.com/advertising',
    scripts: ['alb\\.reddit\\.com/snoo\\.js', 'rdt\\.js']
  },

  // ==========================================
  // 15. MONITORING & OBSERVABILITY
  // ==========================================
  {
    id: 'sentry',
    name: 'Sentry',
    category: 'OBSERVABILITY',
    description: 'Real-time application crash reporting, error tracking, and performance tracing',
    website: 'https://sentry.io',
    js: 'sentry',
    scripts: ['browser\\.sentry-cdn\\.com'],
    network: ['\\.ingest(?:\\.[a-z]+)?\\.sentry\\.io', 'sentry\\.io/api/']
  },
  {
    id: 'datadog_rum',
    name: 'Datadog RUM',
    category: 'OBSERVABILITY',
    description: 'Real-User Monitoring (RUM) and frontend log telemetry by Datadog',
    website: 'https://www.datadoghq.com',
    js: 'datadog_rum',
    cookies: ['^_dd_s$'],
    scripts: ['datadoghq-browser-agent\\.com'],
    network: ['browser-intake-.*datadoghq\\.(?:com|eu)']
  },
  {
    id: 'logrocket',
    name: 'LogRocket',
    category: 'OBSERVABILITY',
    description: 'Session replay combined with network and console error logging',
    website: 'https://logrocket.com',
    js: 'logrocket',
    scripts: ['cdn\\.lr-ingest\\.io', 'cdn\\.logrocket\\.io']
  },
  {
    id: 'newrelic',
    name: 'New Relic Browser',
    category: 'OBSERVABILITY',
    description: 'Application performance monitoring (APM) and browser telemetry',
    website: 'https://newrelic.com',
    js: 'newrelic',
    scripts: ['js-agent\\.newrelic\\.com'],
    network: ['bam\\.nr-data\\.net']
  },
  {
    id: 'bugsnag',
    name: 'Bugsnag',
    category: 'OBSERVABILITY',
    description: 'Automated exception monitoring and application stability management',
    website: 'https://www.bugsnag.com',
    js: 'bugsnag',
    scripts: ['d2wy8f7a9ursnm\\.cloudfront\\.net/v([\\d.]+)/bugsnag']
  },
  {
    id: 'rollbar',
    name: 'Rollbar',
    category: 'OBSERVABILITY',
    description: 'Real-time error alerting and debugging platform',
    website: 'https://rollbar.com',
    js: 'rollbar',
    scripts: ['cdn\\.rollbar\\.com']
  },

  // ==========================================
  // 16. PAYMENTS & CHECKOUT
  // ==========================================
  {
    id: 'stripe',
    name: 'Stripe',
    category: 'PAYMENTS',
    description: 'Online payment processing, billing subscriptions, and fraud prevention',
    website: 'https://stripe.com',
    js: 'stripe',
    cookies: ['^__stripe_mid$', '^__stripe_sid$'],
    scripts: ['js\\.stripe\\.com'],
    network: ['api\\.stripe\\.com', 'm\\.stripe\\.network']
  },
  {
    id: 'paypal',
    name: 'PayPal',
    category: 'PAYMENTS',
    description: 'Digital wallet and online checkout payment gateway',
    website: 'https://www.paypal.com',
    js: 'paypal',
    scripts: ['paypal\\.com/sdk/js', 'paypalobjects\\.com']
  },
  {
    id: 'paddle',
    name: 'Paddle',
    category: 'PAYMENTS',
    description: 'Merchant-of-Record billing, global tax compliance, and SaaS payments',
    website: 'https://www.paddle.com',
    js: 'paddle',
    scripts: ['cdn\\.paddle\\.com']
  },
  {
    id: 'lemonsqueezy',
    name: 'Lemon Squeezy',
    category: 'PAYMENTS',
    description: 'Merchant-of-Record checkout and subscription platform for digital products',
    website: 'https://www.lemonsqueezy.com',
    js: 'lemonsqueezy',
    scripts: ['assets\\.lemonsqueezy\\.com/lemon\\.js']
  },
  {
    id: 'braintree',
    name: 'Braintree',
    category: 'PAYMENTS',
    description: 'Full-stack payment gateway for cards, Venmo, and PayPal',
    website: 'https://www.braintreepayments.com',
    js: 'braintree',
    scripts: ['js\\.braintreegateway\\.com']
  },

  // ==========================================
  // 17. CUSTOMER SUPPORT, CRM & MARKETING
  // ==========================================
  {
    id: 'intercom',
    name: 'Intercom',
    category: 'SUPPORT_CRM',
    description: 'Customer messaging messenger, help center, and AI support desk',
    website: 'https://www.intercom.com',
    js: 'intercom',
    cookies: ['^intercom-id-', '^intercom-session-'],
    scripts: ['widget\\.intercom\\.io'],
    network: ['api-iam\\.intercom\\.io']
  },
  {
    id: 'crisp',
    name: 'Crisp Chat',
    category: 'SUPPORT_CRM',
    description: 'Shared inbox and live customer chat widget',
    website: 'https://crisp.chat',
    js: 'crisp',
    scripts: ['client\\.crisp\\.chat']
  },
  {
    id: 'zendesk',
    name: 'Zendesk',
    category: 'SUPPORT_CRM',
    description: 'Customer service ticketing and live support widget',
    website: 'https://www.zendesk.com',
    js: 'zendesk',
    scripts: ['static\\.zdassets\\.com']
  },
  {
    id: 'drift',
    name: 'Drift',
    category: 'SUPPORT_CRM',
    description: 'B2B conversational marketing and sales chat platform',
    website: 'https://www.salesloft.com/platform/drift/',
    js: 'drift',
    scripts: ['js\\.driftt\\.com']
  },
  {
    id: 'hubspot',
    name: 'HubSpot Marketing / CRM',
    category: 'SUPPORT_CRM',
    description: 'Inbound marketing automation, lead capture forms, and CRM tracking',
    website: 'https://www.hubspot.com',
    js: 'hubspot',
    cookies: ['^__hstc$', '^hubspotutk$'],
    scripts: ['js\\.hs-scripts\\.com', 'js\\.hs-analytics\\.net']
  },
  {
    id: 'klaviyo',
    name: 'Klaviyo',
    category: 'SUPPORT_CRM',
    description: 'E-commerce email and SMS marketing automation platform',
    website: 'https://www.klaviyo.com',
    js: 'klaviyo',
    scripts: ['static\\.klaviyo\\.com']
  },
  {
    id: 'onesignal',
    name: 'OneSignal',
    category: 'SUPPORT_CRM',
    description: 'Web push notifications and in-app messaging service',
    website: 'https://onesignal.com',
    js: 'onesignal',
    scripts: ['cdn\\.onesignal\\.com']
  },

  // ==========================================
  // 18. GRAPHICS, MAPS, CHARTS & RICH MEDIA
  // ==========================================
  {
    id: 'threejs',
    name: 'Three.js (WebGL)',
    category: 'GRAPHICS_MEDIA',
    description: '3D graphics library using WebGL and WebGPU in the browser',
    website: 'https://threejs.org',
    js: 'threejs',
    scripts: ['three(?:\\.min|\\.module)?\\.js']
  },
  {
    id: 'pixijs',
    name: 'PixiJS',
    category: 'GRAPHICS_MEDIA',
    description: 'Fast 2D WebGL rendering engine for interactive graphics',
    website: 'https://pixijs.com',
    js: 'pixijs',
    scripts: ['pixi(?:\\.min)?\\.js']
  },
  {
    id: 'gsap',
    name: 'GSAP (GreenSock)',
    category: 'GRAPHICS_MEDIA',
    description: 'Professional timeline and scroll-driven web animation library',
    website: 'https://gsap.com',
    js: 'gsap',
    scripts: ['gsap(?:\\.min)?\\.js']
  },
  {
    id: 'lottie',
    name: 'Lottie',
    category: 'GRAPHICS_MEDIA',
    description: 'Vector animation player rendering exported After Effects JSON animations',
    website: 'https://lottiefiles.com',
    js: 'lottie',
    scripts: ['lottie(?:-player|\\.min)?\\.js']
  },
  {
    id: 'd3',
    name: 'D3.js',
    category: 'GRAPHICS_MEDIA',
    description: 'Data-Driven Documents library for custom interactive SVG/Canvas data visualizations',
    website: 'https://d3js.org',
    js: 'd3',
    scripts: ['d3(?:\\.v\\d+)?(?:\\.min)?\\.js']
  },
  {
    id: 'chartjs',
    name: 'Chart.js',
    category: 'GRAPHICS_MEDIA',
    description: 'HTML5 Canvas charting library for responsive graphs',
    website: 'https://www.chartjs.org',
    js: 'chartjs',
    scripts: ['chart(?:\\.umd)?(?:\\.min)?\\.js']
  },
  {
    id: 'echarts',
    name: 'Apache ECharts',
    category: 'GRAPHICS_MEDIA',
    description: 'Interactive charting and data visualization library',
    website: 'https://echarts.apache.org',
    js: 'echarts',
    scripts: ['echarts(?:\\.min)?\\.js']
  },
  {
    id: 'highcharts',
    name: 'Highcharts',
    category: 'GRAPHICS_MEDIA',
    description: 'Commercial interactive charting library for financial and business data',
    website: 'https://www.highcharts.com',
    js: 'highcharts',
    scripts: ['highcharts\\.js']
  },
  {
    id: 'mapbox',
    name: 'Mapbox GL JS',
    category: 'GRAPHICS_MEDIA',
    description: 'Vector maps and geospatial visualization engine rendered via WebGL',
    website: 'https://www.mapbox.com',
    js: 'mapbox',
    scripts: ['api\\.mapbox\\.com/mapbox-gl-js/v([\\d.]+)/']
  },
  {
    id: 'google_maps',
    name: 'Google Maps API',
    category: 'GRAPHICS_MEDIA',
    description: 'Embedded Google Maps, Places autocomplete, and geocoding SDK',
    website: 'https://developers.google.com/maps',
    js: 'google_maps',
    scripts: ['maps\\.googleapis\\.com/maps/api/js']
  },
  {
    id: 'leaflet',
    name: 'Leaflet',
    category: 'GRAPHICS_MEDIA',
    description: 'Open-source JavaScript library for mobile-friendly interactive maps',
    website: 'https://leafletjs.com',
    js: 'leaflet',
    scripts: ['leaflet(?:\\.min)?\\.js']
  },
  {
    id: 'cloudinary',
    name: 'Cloudinary',
    category: 'GRAPHICS_MEDIA',
    description: 'On-the-fly image and video optimization, transformation, and CDN',
    website: 'https://cloudinary.com',
    network: ['res\\.cloudinary\\.com']
  },
  {
    id: 'imgix',
    name: 'imgix',
    category: 'GRAPHICS_MEDIA',
    description: 'Real-time image processing and visual media delivery network',
    website: 'https://www.imgix.com',
    network: ['\\.imgix\\.net']
  },
  {
    id: 'mux',
    name: 'Mux Video',
    category: 'GRAPHICS_MEDIA',
    description: 'Developer API for adaptive HLS video streaming and analytics',
    website: 'https://www.mux.com',
    network: ['stream\\.mux\\.com', 'image\\.mux\\.com']
  },
  {
    id: 'monaco',
    name: 'Monaco Editor',
    category: 'GRAPHICS_MEDIA',
    description: 'Browser-based code editor engine that powers VS Code',
    website: 'https://microsoft.github.io/monaco-editor/',
    js: 'monaco',
    scripts: ['monaco-editor']
  },
  {
    id: 'codemirror',
    name: 'CodeMirror',
    category: 'GRAPHICS_MEDIA',
    description: 'Extensible in-browser code editor component',
    website: 'https://codemirror.net',
    js: 'codemirror'
  },
  {
    id: 'tinymce',
    name: 'TinyMCE',
    category: 'GRAPHICS_MEDIA',
    description: 'WYSIWYG rich text editor component',
    website: 'https://www.tiny.cloud',
    js: 'tinymce',
    scripts: ['tinymce(?:\\.min)?\\.js']
  },
  {
    id: 'pdfjs',
    name: 'PDF.js',
    category: 'GRAPHICS_MEDIA',
    description: 'Mozilla’s HTML5 Canvas PDF document viewer',
    website: 'https://mozilla.github.io/pdf.js/',
    js: 'pdfjs',
    scripts: ['pdf(?:\\.min)?\\.js', 'pdf\\.worker']
  },

  // ==========================================
  // 19. SECURITY, BOT PROTECTION & CONSENT
  // ==========================================
  {
    id: 'turnstile',
    name: 'Cloudflare Turnstile',
    category: 'SECURITY',
    description: 'Privacy-preserving CAPTCHA alternative for bot verification',
    website: 'https://www.cloudflare.com/products/turnstile/',
    js: 'turnstile',
    scripts: ['challenges\\.cloudflare\\.com/turnstile/']
  },
  {
    id: 'recaptcha',
    name: 'Google reCAPTCHA',
    category: 'SECURITY',
    description: 'Automated bot and abuse protection service by Google',
    website: 'https://www.google.com/recaptcha/',
    js: 'recaptcha',
    scripts: ['google\\.com/recaptcha/', 'gstatic\\.com/recaptcha/']
  },
  {
    id: 'hcaptcha',
    name: 'hCaptcha',
    category: 'SECURITY',
    description: 'Bot mitigation and human verification challenge platform',
    website: 'https://www.hcaptcha.com',
    js: 'hcaptcha',
    scripts: ['js\\.hcaptcha\\.com']
  },
  {
    id: 'datadome',
    name: 'DataDome',
    category: 'SECURITY',
    description: 'AI-powered bot and online fraud protection engine',
    website: 'https://datadome.co',
    headers: { 'x-datadome': '.*' },
    cookies: ['^datadome$'],
    scripts: ['js\\.datadome\\.co']
  },
  {
    id: 'onetrust',
    name: 'OneTrust Consent',
    category: 'SECURITY',
    description: 'Enterprise GDPR/CCPA cookie compliance and privacy management banner',
    website: 'https://www.onetrust.com',
    js: 'onetrust',
    cookies: ['^OptanonConsent$', '^OptanonAlertBoxClosed$'],
    scripts: ['cdn\\.cookielaw\\.org']
  },
  {
    id: 'cookiebot',
    name: 'Cookiebot',
    category: 'SECURITY',
    description: 'Automated cookie consent banner and privacy compliance service',
    website: 'https://www.cookiebot.com',
    js: 'cookiebot',
    cookies: ['^CookieConsent$'],
    scripts: ['consent\\.cookiebot\\.com']
  },

  // ==========================================
  // 20. FONTS & ICON SYSTEMS
  // ==========================================
  {
    id: 'google_fonts',
    name: 'Google Fonts',
    category: 'FONTS_ICONS',
    description: 'Hosted open-source web font delivery service by Google',
    website: 'https://fonts.google.com',
    links: ['fonts\\.googleapis\\.com', 'fonts\\.gstatic\\.com'],
    network: ['fonts\\.googleapis\\.com', 'fonts\\.gstatic\\.com']
  },
  {
    id: 'adobe_fonts',
    name: 'Adobe Fonts (Typekit)',
    category: 'FONTS_ICONS',
    description: 'Commercial web font hosting service from Adobe Creative Cloud',
    website: 'https://fonts.adobe.com',
    links: ['use\\.typekit\\.net'],
    scripts: ['use\\.typekit\\.net']
  },
  {
    id: 'lucide',
    name: 'Lucide Icons',
    category: 'FONTS_ICONS',
    description: 'Clean, consistent open-source stroke SVG icon toolkit',
    website: 'https://lucide.dev',
    dom: 'lucide'
  },
  {
    id: 'fontawesome',
    name: 'Font Awesome',
    category: 'FONTS_ICONS',
    description: 'Popular web icon font and SVG icon library',
    website: 'https://fontawesome.com',
    dom: 'fontawesome',
    links: ['fontawesome', 'font-awesome'],
    scripts: ['kit\\.fontawesome\\.com']
  },
  {
    id: 'material_icons',
    name: 'Material Symbols / Icons',
    category: 'FONTS_ICONS',
    description: 'Google’s variable icon font and symbol system',
    website: 'https://fonts.google.com/icons',
    dom: 'material_icons',
    links: ['fonts\\.googleapis\\.com/icon\\?family=Material']
  },
  {
    id: 'phosphor_icons',
    name: 'Phosphor Icons',
    category: 'FONTS_ICONS',
    description: 'Flexible multi-weight icon family for interfaces',
    website: 'https://phosphoricons.com',
    dom: 'phosphor_icons'
  },
  {
    id: 'bootstrap_icons',
    name: 'Bootstrap Icons',
    category: 'FONTS_ICONS',
    description: 'Official open-source SVG icon library for Bootstrap',
    website: 'https://icons.getbootstrap.com',
    dom: 'bootstrap_icons',
    links: ['bootstrap-icons']
  }
];
