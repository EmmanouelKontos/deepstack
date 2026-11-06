# DeepStack — Tech Stack & Architecture Inspector

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Support%20DeepStack-FFDD00?style=flat-square&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/emmanouilkontos)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://github.com/EmmanouelKontos/deepstack)

A Manifest V3 extension for Chrome, Brave and Edge that shows how the website in your current tab is built. Every finding lists the evidence it came from, such as a script URL, response header, DOM marker or cookie name, together with a confidence score.

## What it shows

| Tab | Contents |
| :--- | :--- |
| **Stack** | Plain-English summary, a four-layer map (interface, backend, hosting, services), and every detected technology grouped by category, with versions, confidence and expandable evidence. Filter with `/`. |
| **Internals** | Rendering model (SSR, SSG, RSC streaming, islands, SPA), framework metadata (router, build ID, route), bundler, service workers, IndexedDB, Cache Storage and storage key names. |
| **Network** | TTFB, first paint, protocol, compression, CDN cache status, DNS (CNAME/MX/SPF/TXT), API endpoints (REST, GraphQL, tRPC, WebSocket, SSE), hosts allowed by CSP but not yet contacted, and third-party domains. |
| **Security** | A–F grade across HTTPS, HSTS, CSP, MIME sniffing, clickjacking, referrer, permissions and cross-origin policies, plus a cookie flag audit. Failing checks include a copyable fix. |
| **Design & SEO** | Computed color palette, typography, loaded web fonts, `:root` CSS variables, Open Graph tags, canonical URL and JSON-LD types. |

Export the report as Markdown or JSON (copy or download). Click any value to copy it.

**Shortcuts:** `1`–`5` switch tabs · `/` or `⌘K` filters · `E` expands all evidence · `R` rescans · `C` copies Markdown · `Esc` clears.

## Privacy

Analysis runs locally. DeepStack never reads cookie or storage values, and strips `Set-Cookie` values from captured headers. It makes network requests only when you open the popup: an optional DNS-over-HTTPS lookup of the domain name (turn it off in Settings), and a cookie-less `HEAD` request if the tab was opened before the extension. See [PRIVACY.md](PRIVACY.md).

## Install (unpacked)

1. Open `chrome://extensions` (or `brave://extensions`).
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select this folder.

## Build for the Chrome Web Store

```bash
./scripts/build.sh
```

This writes `dist/deepstack-v<version>.zip`. The store listing copy is in [store/listing.md](store/listing.md), and the privacy-tab answers are in [CHROME_WEB_STORE_GUIDE.md](CHROME_WEB_STORE_GUIDE.md).

## Project structure

```
src/
  background/
    service-worker.js     message routing, snapshot collection, badge
    tab-store.js          per-tab header/URL capture, persisted to storage.session
  content/
    main-world-probe.js   MAIN world: framework globals, React/Next/Nuxt/Astro internals, perf, storage key names
    isolated-collector.js ISOLATED world: DOM markers, scripts/links, meta, CSS tokens, palette, typography
  engine/
    analyzer.js           entry point: builds context, runs matchers, assembles the report
    signatures.js         technology signature database
    compiled-signatures.js, match-signatures.js, detections.js, enrich.js
    network.js, security.js, csp.js, summary.js, dns-inspector.js, url.js
  shared/settings.js      preferences shared by popup and service worker
  popup/
    popup.html, popup.js  shell and controller
    panels/               stack, internals, network, security, design
    lib/                  dom helpers, controls, export, feedback, theme
    styles/               tokens, layout, components, panels
```

## Support

DeepStack is free and open source. If it saves you time, consider [buying me a coffee](https://buymeacoffee.com/emmanouilkontos).

Author: [Emmanouil Kontos](https://emmanouilkontos.com) ([@EmmanouelKontos](https://github.com/EmmanouelKontos))
