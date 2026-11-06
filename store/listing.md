# Chrome Web Store listing — DeepStack v1.2.0

Copy each block into the matching field of the Developer Dashboard
(**Item → Store listing**). Paste the plain text only, not the Markdown fences.

> Why this copy looks the way it does: v1.1.0 was flagged for **Keyword spam
> (Yellow Argon)** because the description listed dozens of framework, hosting
> and SaaS brand names. Google treats long lists of brands or keywords as
> spam, even when the extension can detect all of them. This copy describes
> what the extension *does*, in categories, and names no third-party products.
> Keep it that way when you edit it later: no brand lists, no comparisons to
> other extensions, no repeated keywords.

---

## Title (max 75 chars)

```
DeepStack — Tech Stack & Architecture Inspector
```

## Summary (max 132 chars)

```
See how any website is built: frameworks, hosting, APIs, security headers and design tokens, with the evidence behind each finding.
```

## Category

`Developer Tools`

## Detailed description

```
DeepStack shows you how the website in your current tab is built. Click the toolbar icon to get a structured report you can read in under a minute.

Every finding shows its evidence, such as the script URL, response header or page markup it was based on, along with a confidence score. You can check each result yourself instead of trusting a label.

WHAT THE REPORT COVERS

Stack
The frameworks, libraries, content platforms, hosting and third-party services the page uses, grouped by category, with versions where the page exposes them.

App internals
How the page is rendered (server-rendered, static, client-side or streamed), build tool fingerprints, service workers, and the names of browser storage keys.

Network and APIs
Server response time, protocol, compression and cache status. It also lists the API endpoints the page called, the third-party domains it contacted, and the services allowed by its Content Security Policy.

Security
Checks HTTPS, HSTS, Content Security Policy, clickjacking protection and the other common security headers, and gives a letter grade with a plain-English explanation for each check. Cookies are audited for their security flags by name only.

Design and SEO
The color palette (click a color to copy it), fonts, CSS custom properties, structured data and canonical metadata.

Export
Copy the full report as Markdown or JSON, or download it, for audits, documentation or client handoffs.

PRIVACY

All analysis runs locally in your browser. DeepStack has no servers, no analytics and no accounts. It never reads cookie values, storage values or anything you type into forms.

Optionally, you can turn on DNS lookups in the report's settings to identify a site's hosting and email providers from its public DNS records. This is off by default. When on, only the domain name is sent, to a public DNS-over-HTTPS resolver.

DeepStack is free and open source: https://github.com/EmmanouelKontos/deepstack
```

---

## Notes for the reviewer (Dashboard → "Notes for reviewer", optional)

```
v1.2.0 addresses the Yellow Argon (keyword spam) violation: the detailed description has been rewritten to describe functionality by category and no longer lists third-party brand names. No permissions were added.
```

## Screenshots

The current 1280×800 screenshot is a mock-up of the v1.1 UI. Replace it with
real captures of the v1.2 popup, because Google requires screenshots to show
the actual product. Avoid adding headline claims or lists of brand names to
the image.
