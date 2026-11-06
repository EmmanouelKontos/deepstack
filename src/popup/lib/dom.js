/** Escaping, formatting and small HTML builders shared by every popup panel. */

export function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function safeExternalUrl(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : null;
  } catch {
    return null;
  }
}

export function safeHexColor(hex) {
  return typeof hex === 'string' && /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex.toUpperCase() : '#000000';
}

/** Escapes, then renders **bold** spans from the analyzer's summary sentence. */
export function boldMarkdown(text) {
  return esc(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

export function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatMs(ms) {
  if (typeof ms !== 'number') return '—';
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${ms} ms`;
}

export function pluralize(count, word, plural = `${word}s`) {
  return `${count} ${count === 1 ? word : plural}`;
}

/* ---------- HTML builders (all inputs must already be escaped or trusted) ---------- */

export function sectionCard({ title, badge = '', subtitle = '', body = '', id = '' }) {
  return `
    <section class="card"${id ? ` id="${esc(id)}"` : ''}>
      <header class="card-head">
        <h2 class="card-title">${esc(title)}</h2>
        ${badge !== '' ? `<span class="badge tnum">${esc(badge)}</span>` : ''}
      </header>
      ${subtitle ? `<p class="card-sub">${subtitle}</p>` : ''}
      ${body}
    </section>`;
}

/** rows: Array<[label, value, { copy?: string, mono?: boolean }]>. Values are escaped here. */
export function kvGrid(rows) {
  const visible = rows.filter((r) => r && r[1] !== null && r[1] !== undefined && r[1] !== '');
  if (visible.length === 0) return '';
  return `<dl class="kv">${visible
    .map(([label, value, opts = {}]) => {
      const copy = opts.copy ? ` data-copy="${esc(opts.copy)}" title="Click to copy"` : '';
      return `<dt>${esc(label)}</dt><dd class="${opts.mono === false ? '' : 'mono'}${opts.copy ? ' copyable' : ''}"${copy}>${esc(value)}</dd>`;
    })
    .join('')}</dl>`;
}

export function chips(items, { tone = '', copy = true, title = null } = {}) {
  if (!items || items.length === 0) return '';
  return `<div class="chips">${items
    .map((item) => {
      const label = typeof item === 'string' ? item : item.label;
      const t = typeof item === 'string' ? title?.(item) : item.title;
      const itemTone = typeof item === 'string' ? tone : item.tone || tone;
      const icon = typeof item === 'string' ? '' : item.icon || '';
      return `<span class="chip ${itemTone}"${copy ? ` data-copy="${esc(label)}"` : ''}${t ? ` title="${esc(t)}"` : ''}>${icon}${esc(label)}</span>`;
    })
    .join('')}</div>`;
}

export function emptyLine(text) {
  return `<p class="empty-line">${esc(text)}</p>`;
}
