import { chips, emptyLine, esc, kvGrid, safeHexColor, sectionCard } from '../lib/dom.js';

/** Design & SEO tab: palette, typography, CSS tokens and search metadata. */

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function paletteCard(palette) {
  const body = palette.length
    ? `<div class="swatches">${palette
        .map((p) => {
          const hex = safeHexColor(p.hex);
          const ink = luminance(hex) > 0.45 ? '#111113' : '#F4F4F5';
          return `<button type="button" class="swatch" data-copy="${hex}" title="Copy ${hex}" style="background:${hex};color:${ink}">
            <span class="mono">${hex}</span>
          </button>`;
        })
        .join('')}</div>`
    : emptyLine('No colors could be computed from this page.');
  return sectionCard({
    title: 'Color palette',
    badge: palette.length,
    subtitle: 'Most-used background and text colors across key page elements. Click to copy.',
    body
  });
}

function fontLine(f) {
  return f ? `${f.family} · ${f.size} · ${f.weight}` : null;
}

function darkModeLabel(dm = {}) {
  if (dm.dataTheme) return `data-theme="${dm.dataTheme}"`;
  if (dm.htmlClassDark) return '.dark class on root';
  return dm.colorScheme && dm.colorScheme !== 'normal' ? `color-scheme: ${dm.colorScheme}` : 'Not detected';
}

export function renderDesignPanel(report, container) {
  const ds = report.designSystem || {};
  const seo = report.metaAndSeo || {};
  const meta = seo.meta || {};
  const typo = ds.typography || {};
  const fonts = report.internals?.capabilities?.fonts || [];
  const tokens = ds.rootVariables || [];

  const tokenRows = tokens.slice(0, 30).map((v) => {
    // Strict allow-list: page-controlled values must never reach a style attribute as url() etc.
    const isColor = /^#[0-9a-f]{3,8}$/i.test(v.value) || /^(rgba?|hsla?|oklch|oklab)\([\d.,%\s/deg+-]+\)$/i.test(v.value);
    return `<dt class="mono">${esc(v.name)}</dt><dd class="mono copyable" data-copy="var(${esc(v.name)})" title="Copy var(${esc(v.name)})">${
      isColor ? `<span class="token-dot" style="background:${esc(v.value)}"></span>` : ''
    }${esc(v.value)}</dd>`;
  });

  container.innerHTML = [
    paletteCard(ds.palette || []),
    sectionCard({
      title: 'Typography',
      subtitle: 'Computed font family, size and weight.',
      body:
        kvGrid([
          ['Headings', fontLine(typo.heading), { copy: typo.heading?.fullStack }],
          ['Body', fontLine(typo.body), { copy: typo.body?.fullStack }],
          ['Code', typo.code?.family, { copy: typo.code?.fullStack }],
          ['Dark mode', darkModeLabel(ds.darkMode)]
        ]) + (fonts.length ? `<p class="sublabel">Loaded web fonts</p>${chips(fonts)}` : '')
    }),
    tokens.length
      ? sectionCard({
          title: 'CSS custom properties',
          badge: tokens.length,
          subtitle: 'Variables declared on :root. Click to copy the var() reference.',
          body: `<dl class="kv kv-headers">${tokenRows.join('')}</dl>`
        })
      : '',
    sectionCard({
      title: 'SEO & metadata',
      subtitle: 'Search metadata, Open Graph tags and structured data.',
      body:
        kvGrid([
          ['Title', report.title, { mono: false, copy: report.title }],
          ['Description', meta.description, { mono: false }],
          ['Canonical', seo.canonicalUrl, { copy: seo.canonicalUrl }],
          ['Robots', meta.robots],
          ['OG site name', meta['og:site_name'], { mono: false }],
          ['OG type', meta['og:type']],
          ['OG image', meta['og:image'], { copy: meta['og:image'] }],
          ['Generator', meta.generator],
          ['Web app manifest', seo.pwaManifestUrl, { copy: seo.pwaManifestUrl }]
        ]) +
        ((seo.jsonLdSchemas || []).length
          ? `<p class="sublabel">Schema.org types</p>${chips(seo.jsonLdSchemas)}`
          : emptyLine('No JSON-LD structured data found.'))
    })
  ].join('');
}
