# Chrome Web Store Submission Copy-Paste Guide

When uploading [dist/deepstack-v1.1.0.zip](file:///home/emmanouilkontos/Projects/plugin/dist/deepstack-v1.1.0.zip) (also copied to `~/Downloads/deepstack-v1.1.0.zip` for Brave Flatpak access) in the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole), use the exact answers below under the **Store Listing** and **Privacy Practices** tabs.

---

## 1. Store Listing Tab

- **Title:** `DeepStack — Full-Stack & Architecture Inspector`
- **Summary (up to 132 chars):**
  `Inspect any website's full tech stack, framework versions, SSR/RSC internals, backend & DNS infrastructure, APIs, and security.`
- **Category:** `Developer Tools`
- **Language:** `English`

---

## 2. Privacy Practices Tab (Permission Justifications)

### Single Purpose Description
> Inspect and identify the technology stack, frontend/backend frameworks, runtime versions, DNS infrastructure, API endpoints, security posture, and design system of the currently visited webpage.

### Permission Justifications

- **`activeTab`**
  > Required to inspect the currently active tab's URL, DOM markers, and technology stack when the user opens the DeepStack popup.

- **`scripting`**
  > Required to inject read-only page inspection scripts into already-open tabs when the user clicks the DeepStack icon, allowing detection of JavaScript framework versions (e.g., React, Vue, Next.js, Nuxt) without forcing a page reload.

- **`webRequest`**
  > Required to read HTTP response headers (such as `Server`, `X-Powered-By`, `CF-Ray`, `Content-Security-Policy`, and `Strict-Transport-Security`) and subresource request URLs in real time to identify CDNs, backend servers, API endpoints, and security posture.

- **`cookies`**
  > Required to read cookie names and security attributes (`HttpOnly`, `Secure`, `SameSite`) on the inspected page in order to detect backend frameworks (including `HttpOnly` session cookies like `PHPSESSID`, `laravel_session`, `JSESSIONID`, and `ASP.NET_SessionId`) and audit session security. DeepStack never reads or transmits cookie values.

- **`storage`**
  > Required to store local user UI preferences inside the browser.

- **Host Permissions (`http://*/*`, `https://*/*`)**
  > Required because DeepStack is a universal web developer diagnostic tool that inspects HTTP response headers, DOM nodes, and public DNS records on any website the user visits.

### Remote Code
- **Are you using remote code?**
  Select: **`No, I am not using Remote code`** (all JavaScript and SVG icons are bundled inside the extension package).

### Data Usage Certification
- Check **all three** certification boxes confirming you do not sell user data or use it for unrelated purposes.
- **Privacy Policy URL:**
  `https://github.com/EmmanouelKontos/deepstack/blob/main/PRIVACY.md`
- **Homepage / Support URL:**
  `https://github.com/EmmanouelKontos/deepstack`

