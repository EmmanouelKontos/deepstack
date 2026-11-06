import { UI_ICONS } from '../icons.js';
import { chips, emptyLine, esc, sectionCard } from '../lib/dom.js';

/** Security tab: grade summary, per-check rows with fixes, cookie flags and raw headers. */

export function gradeTone(grade) {
  if (!grade) return 'muted';
  if (grade.startsWith('A')) return 'pass';
  if (grade === 'B' || grade === 'C') return 'warn';
  return 'fail';
}

function gradeCard(sec) {
  const checks = sec.checks || [];
  const passed = checks.filter((c) => c.status === 'pass').length;
  const fixes = checks.filter((c) => c.fix && c.status !== 'info').length;
  const tone = gradeTone(sec.grade);
  return `
    <section class="grade-card" data-tone="${tone}">
      <div class="grade-letter" aria-label="Grade ${esc(sec.grade)}">${esc(sec.grade || '—')}</div>
      <div class="grade-body">
        <p class="grade-title">Security headers</p>
        <div class="meter" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${sec.score ?? 0}">
          <span style="width:${Math.max(2, sec.score ?? 0)}%"></span>
        </div>
        <p class="grade-meta tnum">${sec.score ?? 0}/100 · ${passed} of ${checks.length} checks pass${fixes ? ` · ${fixes} to fix` : ''}</p>
      </div>
    </section>`;
}

function checkRow(c) {
  return `
    <div class="check" data-status="${esc(c.status)}">
      <span class="check-icon">${UI_ICONS[c.status] || UI_ICONS.info}</span>
      <div class="check-main">
        <div class="check-head">
          <span class="check-name">${esc(c.name)}</span>
          <span class="check-val mono" title="${esc(c.value)}">${esc(c.value)}</span>
        </div>
        <p class="check-explain">${esc(c.explanation || '')}</p>
        ${c.fix ? `<button type="button" class="fix mono" data-copy="${esc(c.fix)}" title="Copy fix">${UI_ICONS.copy}<span>${esc(c.fix)}</span></button>` : ''}
      </div>
    </div>`;
}

export function renderSecurityPanel(report, container) {
  const sec = report.securityAudit || {};
  const cookies = sec.cookieSummary || { total: 0, items: [] };
  const headers = Object.entries(sec.rawHeaders || {}).sort((a, b) => a[0].localeCompare(b[0]));

  const cookieChips = cookies.items.map((c) => ({
    label: c.name,
    tone: c.httpOnly ? 'pass' : '',
    icon: c.httpOnly ? UI_ICONS.lock : '',
    title: `${c.domain} · ${c.httpOnly ? 'HttpOnly' : 'readable by JS'} · ${c.secure ? 'Secure' : 'not Secure'} · SameSite=${c.sameSite}`
  }));

  container.innerHTML = [
    gradeCard(sec),
    sectionCard({
      title: 'Checks',
      subtitle: 'Browser defences this site turns on through response headers. Click a fix to copy it.',
      body: `<div class="checks">${(sec.checks || []).map(checkRow).join('')}</div>`
    }),
    sectionCard({
      title: 'Cookies',
      badge: `${cookies.total} · ${cookies.httpOnlyCount || 0} HttpOnly`,
      subtitle: 'Names and flags only. Values are never read. Locked cookies are hidden from page scripts.',
      body: cookieChips.length ? chips(cookieChips) : emptyLine('This site has not set any cookies.')
    }),
    sectionCard({
      title: 'Response headers',
      badge: headers.length,
      subtitle: 'Headers returned for the page document. Cookie values are removed.',
      body: headers.length
        ? `<dl class="kv kv-headers">${headers
            .map(
              ([k, v]) =>
                `<dt class="mono">${esc(k)}</dt><dd class="mono copyable" data-copy="${esc(`${k}: ${v}`)}" title="Click to copy">${esc(String(v).slice(0, 240))}</dd>`
            )
            .join('')}</dl>`
        : emptyLine('No headers captured. Reload the page to capture them.')
    })
  ].join('');
}
