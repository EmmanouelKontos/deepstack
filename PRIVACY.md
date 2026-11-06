# Privacy Policy — DeepStack

**Last updated:** November 2026

DeepStack is a browser extension that shows how the website in your current tab is built. It runs entirely in your browser.

## 1. What DeepStack does not collect

- DeepStack has no servers, analytics, telemetry or accounts. It does not collect, sell or transfer personal data or browsing history.
- It never reads cookie values, `localStorage` / `sessionStorage` values, form contents or authentication tokens.
- `Set-Cookie` response headers are reduced to cookie names before anything is stored or displayed.

## 2. What it reads, locally

When a page loads, and when you open the DeepStack popup, the extension reads:

- page markup, script/stylesheet URLs, JavaScript framework globals and performance timing;
- HTTP response headers and subresource URLs for that tab;
- cookie **names** and their `HttpOnly`, `Secure` and `SameSite` flags;
- browser storage **key names** (not values).

This is analyzed on your device. Per-tab header data is held in the browser's session storage and is deleted when the tab is closed or the browser exits.

## 3. Network requests DeepStack makes

Only when you open the popup:

- **DNS lookup (off by default; you turn it on in Settings):** when enabled, the site's domain name is sent to Cloudflare's public DNS-over-HTTPS resolver (`https://cloudflare-dns.com/dns-query`) to read public CNAME, A, MX and TXT records. No cookies, URL paths, query strings or identifiers are included.
- **Header fallback:** if the tab was opened before DeepStack was running, the extension sends one `HEAD` request to the page's own URL, without cookies, to read its response headers.

Passive page loads never trigger either request.

## 4. Permissions

- **`activeTab`, `scripting`:** run the read-only inspection scripts on the page you are viewing.
- **`webRequest`:** read response headers and request URLs. Requests are never blocked or modified.
- **`cookies`:** read cookie names and security flags, including `HttpOnly` cookies. Values are never read.
- **`storage`:** save your preferences (theme, DNS lookups) and keep per-tab header data for the current browser session.

## 5. Contact

Questions or issues: open an issue at https://github.com/EmmanouelKontos/deepstack.
