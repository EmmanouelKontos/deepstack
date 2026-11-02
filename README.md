# DeepStack — Full Tech Stack & Architecture Inspector (Chrome MV3 Extension)

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Support%20DeepStack-FFDD00?style=flat-square&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/emmanouilkontos)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://github.com/EmmanouelKontos/deepstack)

**DeepStack** is a high-precision, zero-telemetry Chrome/Brave Manifest V3 extension that goes far beyond Wappalyzer to inspect any website's **complete technology stack, exact framework versions, SSR/RSC runtime internals, live DNS/CNAME/MX/SPF infrastructure, hidden CSP domains, security posture, and design system**.

---

## How Wappalyzer Works vs. How DeepStack Improves Upon It

| Capability | Wappalyzer | DeepStack |
| :--- | :--- | :--- |
| **Detection Transparency** | Shows technology names only | **Full Evidence Trail** (`JS Runtime`, `DOM`, `HTTP Header`, `Cookie`, `Script URL`, `CSP Policy`, `Web Storage`, `Implied`) with confidence % |
| **Framework Internals** | Detects "Next.js" or "React" | Inspects **React Fiber roots** (Concurrent vs Legacy), **Next.js App Router (`__next_f` RSC chunks) vs Pages Router (`__NEXT_DATA__`)**, **Astro Islands**, **Shopify theme metadata**, **Bundler chunks** |
| **Pre-Existing Tabs** | Requires manual page refresh on already-open tabs | **Live On-Demand Injection (`chrome.scripting`) + Fallback HEAD Probe** works immediately on already-open tabs |
| **Hidden Infrastructure** | Only inspects loaded scripts/HTML | Parses **`Content-Security-Policy` (CSP)** directives to uncover **dormant/hidden backend & 3rd-party domains** not yet called |
| **API Architecture** | None | Automatically discovers **GraphQL**, **tRPC**, **REST/Fetch API** routes, and **WebSocket** endpoints from `PerformanceResourceTiming` & `webRequest` |
| **Security & Cookie Forensics** | None | Computes **Security Grade (`A+` to `F`)**, inspects HSTS/CSP/XFO/COOP, and audits **`HttpOnly` & `Secure` cookies** |
| **Design System Extraction** | Basic CSS framework regex | Extracts **computed color palette (`#HEX`)**, **typography stack**, **loaded `document.fonts`**, **dark-mode strategy**, and **`:root` CSS tokens** |
| **Export** | Paid / Limited | One-click **Markdown (`MD`)** and **JSON (`JSON`)** full architecture report export |

---

## Installation (Load Unpacked in Chrome / Brave / Edge)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select this directory: `/home/emmanouilkontos/Projects/plugin`
5. Pin **DeepStack** to your toolbar and click it on any website!

---

## Project Structure

- `manifest.json` — Chrome Extension Manifest V3 configuration
- `src/content/main-world-probe.js` — Runs in `MAIN` world to inspect `window` globals, React Fiber trees, Next/Nuxt/Remix/Astro/Shopify payloads, `PerformanceResourceTiming`, Service Workers, `IndexedDB`, and `document.fonts`
- `src/content/isolated-collector.js` — Runs in `ISOLATED` world to scan DOM selectors, Tailwind/CSS-in-JS heuristics, `:root` CSS tokens, computed color palette, typography, and JSON-LD schemas
- `src/engine/signatures.js` — Multi-vector signature database across 19 technology categories with dependency implication graph (`implies`)
- `src/engine/analyzer.js` — Core correlation engine, CSP parser, API endpoint classifier, and security posture grader
- `src/background/service-worker.js` — Captures `main_frame` and subresource HTTP headers via `chrome.webRequest`, reads `HttpOnly` cookies via `chrome.cookies`, manages live script injection, and updates the toolbar badge
- `src/popup/` — 5-tab developer inspection UI (`Stack`, `Internals`, `Network & APIs`, `Security`, `Design & SEO`)

---

## Support the Project

DeepStack is 100% free, local, and open-source with zero tracking. If it saves you time inspecting websites or preparing client audits, consider supporting its development:

- **[Buy Me a Coffee](https://buymeacoffee.com/emmanouilkontos)**
- Author: **[Emmanouil Kontos](https://emmanouilkontos.com)** ([@EmmanouelKontos](https://github.com/EmmanouelKontos))

