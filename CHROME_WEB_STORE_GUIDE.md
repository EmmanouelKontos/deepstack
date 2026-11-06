# Chrome Web Store submission guide

Upload `dist/deepstack-v1.2.0.zip` (build it with `./scripts/build.sh`) in the
[Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).

- **Store listing tab:** copy the title, summary and description from
  [store/listing.md](store/listing.md). That copy was rewritten to resolve the
  v1.1.0 *Keyword spam (Yellow Argon)* rejection, so don't add lists of
  framework or brand names back into it.
- **Privacy practices tab:** use the answers below.

---

## Single purpose description

> Shows the technologies, hosting, network activity, security headers and design tokens of the web page in the active tab, so developers can understand how it is built.

## Permission justifications

- **`activeTab`**
  > Lets DeepStack inspect the page in the active tab when the user opens the popup.

- **`scripting`**
  > Injects DeepStack's read-only inspection scripts into tabs that were already open before the extension was installed or updated, so the user does not have to reload the page.

- **`webRequest`**
  > Reads HTTP response headers (for example `Server`, `Content-Security-Policy`, `Strict-Transport-Security`) and subresource URLs of the inspected tab to identify servers, CDNs, API endpoints and security settings. Requests are never blocked or modified.

- **`cookies`**
  > Reads cookie names and security flags (`HttpOnly`, `Secure`, `SameSite`) of the inspected site, including `HttpOnly` session cookies that page scripts cannot see. Cookie names identify server frameworks, and the flags feed the security audit. Cookie values are never read, stored or transmitted.

- **`storage`**
  > Stores the user's preferences (theme, DNS lookup on/off) and keeps per-tab response headers in session storage so results survive the service worker being suspended.

- **Host permissions (`http://*/*`, `https://*/*`)**
  > DeepStack is a general-purpose developer tool that can inspect any website the user chooses to analyze. It needs host access to read response headers and run its inspection scripts on that site.

## Remote code

**No, I am not using remote code.** All JavaScript and icons ship inside the package.

## Data usage

- Check all three certification boxes. DeepStack does not collect, sell or transfer user data.
- **Privacy policy URL:** `https://github.com/EmmanouelKontos/deepstack/blob/main/PRIVACY.md`
- **Homepage / support URL:** `https://github.com/EmmanouelKontos/deepstack`
