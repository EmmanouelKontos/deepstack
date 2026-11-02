# Privacy Policy — DeepStack

**Last Updated:** November 2026

**DeepStack — Full-Stack & Architecture Inspector** is a local developer diagnostic browser extension.

## 1. Data Collection & Processing
- **Zero Personal Data Collection:** DeepStack does **not** collect, store, transmit, or sell any personal data, browsing history, credentials, cookie values, storage values, or telemetry to any developer server or third party.
- **100% Local Analysis:** All DOM inspection, JavaScript runtime probing, HTTP response header analysis, and cookie metadata checks (`Secure`, `HttpOnly`, `SameSite` flags, and cookie names) execute **exclusively inside your local browser** on your device.
- **Never Reads Sensitive Values:** DeepStack never reads or exports cookie values, `localStorage` values, `sessionStorage` values, form inputs, or authentication tokens.

## 2. Optional Network Queries (DNS-over-HTTPS)
- To identify public domain infrastructure (such as CNAME hosting providers, MX email gateways, and public SPF/TXT records), DeepStack sends standard public DNS queries for the active website's hostname to Cloudflare's public DNS-over-HTTPS resolver (`https://cloudflare-dns.com/dns-query`).
- No user identifiers, cookies, URL paths, or query parameters are included in these DNS lookups.

## 3. Permissions Usage
- **`activeTab` & `scripting`:** Used to inspect the active webpage's DOM markers and JavaScript framework globals when you open or run the extension.
- **`webRequest`:** Used read-only in the browser to inspect HTTP response headers (e.g., `Server`, `X-Powered-By`, `Content-Security-Policy`, `Strict-Transport-Security`) and subresource URLs on the inspected tab.
- **`cookies`:** Used read-only to inspect cookie names and security flags (`HttpOnly`, `Secure`, `SameSite`) to identify backend frameworks (such as `PHPSESSID`, `laravel_session`, or `JSESSIONID`) and audit session security. Cookie values are never stored or transmitted.
- **`storage`:** Used locally to store extension preferences.

## 4. Contact
For questions or issues regarding this privacy policy, please open an issue on this GitHub repository.
