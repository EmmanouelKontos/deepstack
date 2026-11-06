import { UI_ICONS, getCategoryIcon, getTechIcon } from '../icons.js';
import { boldMarkdown, esc, safeExternalUrl } from '../lib/dom.js';

/** Stack tab: plain-English overview, layer map, searchable technology list with evidence drawers. */

const state = { query: '', showEvidence: false, openIds: new Set() };

function confidenceTier(value) {
  if (value >= 90) return { tier: 'high', bars: 3, label: 'Confirmed by multiple signals' };
  if (value >= 65) return { tier: 'mid', bars: 2, label: 'Strong single signal' };
  return { tier: 'low', bars: 1, label: 'Weak or indirect signal' };
}

function matches(tech, cat, q) {
  if (!q) return true;
  const hay = [tech.name, tech.description, tech.version, cat.label, ...tech.evidence.flatMap((e) => [e.type, e.detail])];
  return hay.some((s) => s && String(s).toLowerCase().includes(q));
}

function renderOverview(report) {
  const layers = report.topologyLayers || [];
  return `
    <section class="overview">
      <p class="eyebrow">How this site is built</p>
      <p class="overview-text">${boldMarkdown(report.executiveSummary || '')}</p>
      ${
        layers.length
          ? `<div class="layers">${layers
              .map(
                (l) => `<div class="layer">
                  <span class="layer-label">${esc(l.label)}</span>
                  <span class="layer-items" title="${esc(l.items.join(', '))}">${esc(l.items.join(' · '))}</span>
                </div>`
              )
              .join('')}</div>`
          : ''
      }
    </section>`;
}

function renderTech(tech, cat) {
  const open = state.showEvidence || state.openIds.has(tech.id);
  const conf = confidenceTier(tech.confidence);
  const href = safeExternalUrl(tech.website);
  const evId = `ev-${esc(tech.id)}`;
  return `
    <div class="tech${open ? ' is-open' : ''}" data-tech-id="${esc(tech.id)}">
      <div class="tech-row" role="button" tabindex="0" aria-expanded="${open}" aria-controls="${evId}">
        <span class="tech-icon">${getTechIcon(tech.id, cat.iconKey)}</span>
        <span class="tech-main">
          <span class="tech-name-line">
            <span class="tech-name">${esc(tech.name)}</span>
            ${tech.version ? `<span class="ver mono">${esc(tech.version)}</span>` : ''}
          </span>
          ${tech.description ? `<span class="tech-desc">${esc(tech.description)}</span>` : ''}
        </span>
        <span class="conf" data-tier="${conf.tier}" title="${tech.confidence}% · ${conf.label}">
          <span class="conf-bars" aria-hidden="true">${[1, 2, 3].map((i) => `<i class="${i <= conf.bars ? 'on' : ''}"></i>`).join('')}</span>
          <span class="tnum">${tech.confidence}%</span>
        </span>
        ${href ? `<a class="tech-link" href="${esc(href)}" target="_blank" rel="noopener noreferrer" title="Open ${esc(tech.name)} website" aria-label="Open ${esc(tech.name)} website">${UI_ICONS.externalLink}</a>` : '<span class="tech-link-spacer"></span>'}
        <span class="chev" aria-hidden="true">${UI_ICONS.chevronDown}</span>
      </div>
      <div class="evidence" id="${evId}"${open ? '' : ' hidden'}>
        ${tech.evidence
          .map(
            (ev) => `<div class="ev-row">
              <span class="ev-type">${esc(ev.type)}</span>
              <span class="ev-detail mono" data-copy="${esc(ev.detail)}" title="Click to copy">${esc(ev.detail)}</span>
            </div>`
          )
          .join('')}
      </div>
    </div>`;
}

function renderList(report) {
  const q = state.query;
  let shown = 0;
  const groups = (report.categories || [])
    .map((cat) => {
      const items = cat.items.filter((t) => matches(t, cat, q));
      shown += items.length;
      if (items.length === 0) return '';
      return `
        <section class="group">
          <header class="group-head" title="${esc(cat.description || '')}">
            <span class="group-icon">${getCategoryIcon(cat.iconKey)}</span>
            <h3>${esc(cat.label)}</h3>
            <span class="group-count tnum">${items.length}</span>
          </header>
          <div class="group-body">${items.map((t) => renderTech(t, cat)).join('')}</div>
        </section>`;
    })
    .join('');

  if (shown > 0) return groups;
  if (q) {
    return `<div class="empty"><p class="empty-title">No matches for “${esc(q)}”</p>
      <p class="empty-desc">Search covers names, versions, categories and evidence.</p>
      <button class="btn" type="button" data-action="clear-search">Clear search <kbd>Esc</kbd></button></div>`;
  }
  return `<div class="empty"><p class="empty-title">No technologies identified</p>
    <p class="empty-desc">The page may still be loading, or it was open before DeepStack was installed. Reloading usually finds more.</p>
    <button class="btn" type="button" data-action="reload-page">Reload page and rescan</button></div>`;
}

export function renderStackPanel(report, els) {
  els.overview.innerHTML = renderOverview(report);
  els.list.innerHTML = renderList(report);
  els.evidenceToggle.setAttribute('aria-pressed', String(state.showEvidence));
}

export function setStackQuery(query) {
  state.query = query.trim().toLowerCase();
}

export function toggleAllEvidence() {
  state.showEvidence = !state.showEvidence;
  if (!state.showEvidence) state.openIds.clear();
  return state.showEvidence;
}

/** Wires row expand/collapse once; survives re-renders because it delegates from the list root. */
export function bindStackInteractions(listEl) {
  const toggle = (row) => {
    const card = row.closest('.tech');
    const drawer = card?.querySelector('.evidence');
    if (!card || !drawer) return;
    const open = drawer.hidden;
    drawer.hidden = !open;
    card.classList.toggle('is-open', open);
    row.setAttribute('aria-expanded', String(open));
    const id = card.getAttribute('data-tech-id');
    if (open) state.openIds.add(id);
    else state.openIds.delete(id);
  };
  listEl.addEventListener('click', (e) => {
    if (e.target.closest('a, [data-copy], [data-action]')) return;
    const row = e.target.closest('.tech-row');
    if (row) toggle(row);
  });
  listEl.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('tech-row')) {
      e.preventDefault();
      toggle(e.target);
    }
  });
}
