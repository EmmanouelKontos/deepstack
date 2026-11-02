import { UI_ICONS, getCategoryIcon, getTechIcon } from './icons.js';

/**
 * DeepStack Popup Controller
 * Renders a high-precision, zero-emoji interface with plain-English explanations,
 * architecture topology mapping, and deep technical evidence drawers.
 */

let currentReport = null;
let showAllEvidence = false;
let currentSearchQuery = '';
let currentTheme = localStorage.getItem('deepstack_theme') || 'dark';

const els = {
  brandIconBox: document.getElementById('brand-icon-box'),
  hostPill: document.getElementById('host-pill'),
  renderStrategySub: document.getElementById('render-strategy-sub'),
  summaryStrip: document.getElementById('summary-strip'),
  metricTechCount: document.getElementById('metric-tech-count'),
  metricProtocol: document.getElementById('metric-protocol'),
  metricCache: document.getElementById('metric-cache'),
  metricSecurity: document.getElementById('metric-security'),
  tabCountStack: document.getElementById('tab-count-stack'),
  tabCountApis: document.getElementById('tab-count-apis'),
  stateLoading: document.getElementById('state-loading'),
  stateError: document.getElementById('state-error'),
  errorIconHolder: document.getElementById('error-icon-holder'),
  errorMessage: document.getElementById('error-message'),
  mainContent: document.getElementById('main-content'),
  overviewCard: document.getElementById('overview-card'),
  searchIconHolder: document.getElementById('search-icon-holder'),
  searchInput: document.getElementById('search-input'),
  btnToggleEvidence: document.getElementById('btn-toggle-evidence'),
  stackContainer: document.getElementById('stack-categories-container'),
  internalsContainer: document.getElementById('internals-container'),
  networkContainer: document.getElementById('network-container'),
  securityContainer: document.getElementById('security-container'),
  designContainer: document.getElementById('design-container'),
  btnTheme: document.getElementById('btn-theme'),
  btnRescan: document.getElementById('btn-rescan'),
  btnCopyMd: document.getElementById('btn-copy-md'),
  btnCopyJson: document.getElementById('btn-copy-json'),
  githubIconHolder: document.getElementById('github-icon-holder'),
  coffeeIconHolder: document.getElementById('coffee-icon-holder'),
  toast: document.getElementById('toast')
};

// Initialize static SVG icons
els.brandIconBox.innerHTML = UI_ICONS.brandLogo;
els.searchIconHolder.innerHTML = UI_ICONS.search;
els.btnRescan.innerHTML = UI_ICONS.refresh;
els.errorIconHolder.innerHTML = UI_ICONS.warn;
if (els.githubIconHolder) els.githubIconHolder.innerHTML = UI_ICONS.github;
if (els.coffeeIconHolder) els.coffeeIconHolder.innerHTML = UI_ICONS.coffee;

function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('deepstack_theme', theme);
  els.btnTheme.innerHTML = theme === 'dark' ? UI_ICONS.sun : UI_ICONS.moon;
}

applyTheme(currentTheme);

els.btnTheme.addEventListener('click', () => {
  applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
});

function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeExternalUrl(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.href;
    }
  } catch {}
  return null;
}

function safeHexColor(hex) {
  if (typeof hex === 'string' && /^#[0-9A-Fa-f]{6}$/.test(hex)) {
    return hex.toUpperCase();
  }
  return '#000000';
}

function formatSummaryMarkdownBold(str) {
  const safe = esc(str);
  return safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function showToast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.remove('hidden');
  setTimeout(() => {
    els.toast.classList.add('hidden');
  }, 1800);
}

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Tab switching
function activateTab(target) {
  document.querySelectorAll('.tab').forEach((b) => {
    b.classList.toggle('active', b.getAttribute('data-tab') === target);
  });
  document.querySelectorAll('.tab-panel').forEach((p) => {
    p.classList.toggle('active', p.id === `panel-${target}`);
  });
}

document.querySelectorAll('.tab').forEach((tabBtn) => {
  tabBtn.addEventListener('click', () => {
    const target = tabBtn.getAttribute('data-tab');
    if (target) activateTab(target);
  });
});

// Keyboard shortcuts (/ or Cmd/Ctrl+K to search, Esc to clear search, 1-5 to switch tabs)
window.addEventListener('keydown', (e) => {
  const isInput = document.activeElement === els.searchInput;
  if ((e.key === '/' && !isInput) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
    e.preventDefault();
    activateTab('stack');
    els.searchInput.focus();
    els.searchInput.select();
    return;
  }
  if (e.key === 'Escape' && (isInput || currentSearchQuery)) {
    if (currentSearchQuery) {
      e.preventDefault();
      els.searchInput.value = '';
      currentSearchQuery = '';
      if (currentReport) renderStackPanel(currentReport);
    } else if (isInput) {
      e.preventDefault();
      els.searchInput.blur();
    }
    return;
  }
  if (!isInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
    const tabMap = { '1': 'stack', '2': 'internals', '3': 'network', '4': 'security', '5': 'design' };
    if (tabMap[e.key]) {
      activateTab(tabMap[e.key]);
    }
  }
});

// Search input
els.searchInput.addEventListener('input', (e) => {
  currentSearchQuery = e.target.value.trim().toLowerCase();
  if (currentReport) renderStackPanel(currentReport);
});

// Toggle all proof
els.btnToggleEvidence.addEventListener('click', () => {
  showAllEvidence = !showAllEvidence;
  els.btnToggleEvidence.classList.toggle('active', showAllEvidence);
  els.btnToggleEvidence.textContent = showAllEvidence ? 'Hide Proof' : 'Technical Proof';
  if (currentReport) renderStackPanel(currentReport);
});

// Rescan button
els.btnRescan.addEventListener('click', () => {
  inspectCurrentTab(true);
});

// Copy Markdown
els.btnCopyMd.addEventListener('click', () => {
  if (!currentReport) return;
  const md = generateMarkdownReport(currentReport);
  navigator.clipboard.writeText(md).then(() => showToast('Markdown report copied to clipboard'));
});

// Copy JSON
els.btnCopyJson.addEventListener('click', () => {
  if (!currentReport) return;
  navigator.clipboard.writeText(JSON.stringify(currentReport, null, 2)).then(() => showToast('JSON report copied to clipboard'));
});

async function inspectCurrentTab(forceRefresh = false) {
  els.stateLoading.classList.remove('hidden');
  els.stateError.classList.add('hidden');
  els.mainContent.classList.add('hidden');
  els.summaryStrip.classList.add('hidden');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      throw new Error('No active browser tab found.');
    }
    if (!tab.url || (!tab.url.startsWith('http://') && !tab.url.startsWith('https://'))) {
      throw new Error(`Cannot inspect internal browser URL (${tab.url || 'unknown'}).`);
    }

    const response = await chrome.runtime.sendMessage({
      type: 'DEEPSTACK_INSPECT_TAB',
      tabId: tab.id,
      tabUrl: tab.url,
      forceRefresh
    });

    if (!response || !response.ok || !response.report) {
      throw new Error(response?.error || 'Failed to analyze page.');
    }

    currentReport = response.report;
    renderFullReport(currentReport);
  } catch (err) {
    els.stateLoading.classList.add('hidden');
    els.stateError.classList.remove('hidden');
    els.errorMessage.textContent = err.message || String(err);
  }
}

function renderFullReport(report) {
  els.stateLoading.classList.add('hidden');
  els.stateError.classList.add('hidden');
  els.mainContent.classList.remove('hidden');
  els.summaryStrip.classList.remove('hidden');

  els.hostPill.textContent = report.hostname || 'Website';
  const strategy = report.internals?.frameworkInternals?.renderingStrategy || 'Client / Static Web Page';
  els.renderStrategySub.textContent = strategy;

  els.metricTechCount.textContent = `${report.totalDetected} detected`;
  els.metricProtocol.textContent = (report.networkArchitecture?.protocol || 'HTTP').toUpperCase();

  const ttfb = report.networkArchitecture?.ttfbMs !== null && report.networkArchitecture?.ttfbMs !== undefined
    ? `${report.networkArchitecture.ttfbMs} ms (${report.networkArchitecture.speedRating || 'Good'})`
    : '—';
  els.metricCache.textContent = ttfb;

  const secGrade = report.securityAudit?.grade || '—';
  const secScore = report.securityAudit?.score ?? 0;
  els.metricSecurity.textContent = `Grade ${secGrade} (${secScore}/100)`;

  els.tabCountStack.textContent = String(report.totalDetected);
  const apiCount =
    (report.networkArchitecture?.apiEndpoints?.length || 0) +
    (report.networkArchitecture?.dormantCspHosts?.length || 0);
  els.tabCountApis.textContent = String(apiCount);

  renderOverviewCard(report);
  renderStackPanel(report);
  renderInternalsPanel(report);
  renderNetworkPanel(report);
  renderSecurityPanel(report);
  renderDesignPanel(report);
}

// =========================================================
// EXECUTIVE OVERVIEW & TOPOLOGY MAP
// =========================================================
function renderOverviewCard(report) {
  const layers = report.topologyLayers || [];
  els.overviewCard.innerHTML = `
    <div class="overview-header">How this website is built</div>
    <p class="overview-sentence">${formatSummaryMarkdownBold(report.executiveSummary || '')}</p>
    ${
      layers.length > 0
        ? `<div class="topology-grid">
            ${layers
              .map(
                (l) => `
                <div class="topology-box">
                  <div class="topology-label">${esc(l.label)}</div>
                  <div class="topology-items" title="${esc(l.items.join(', '))}">${esc(l.items.join(' · '))}</div>
                </div>
              `
              )
              .join('')}
          </div>`
        : ''
    }
  `;
}

// =========================================================
// PANEL 1: TECH STACK + PLAIN-ENGLISH DESCRIPTIONS
// =========================================================
function renderStackPanel(report) {
  const categories = report.categories || [];
  let html = '';
  let matchedCount = 0;

  for (const cat of categories) {
    const filteredItems = cat.items.filter((t) => {
      if (!currentSearchQuery) return true;
      const inName = t.name.toLowerCase().includes(currentSearchQuery);
      const inDesc = (t.description || '').toLowerCase().includes(currentSearchQuery);
      const inCat = cat.label.toLowerCase().includes(currentSearchQuery);
      const inEv = t.evidence.some(
        (ev) =>
          ev.type.toLowerCase().includes(currentSearchQuery) ||
          ev.detail.toLowerCase().includes(currentSearchQuery)
      );
      return inName || inDesc || inCat || inEv;
    });

    if (filteredItems.length === 0) continue;
    matchedCount += filteredItems.length;

    html += `
      <div class="category-group">
        <div class="category-header" title="${esc(cat.description || '')}">
          <div class="category-title-wrap">
            <span class="category-icon">${getCategoryIcon(cat.iconKey)}</span>
            <span class="category-title">${esc(cat.label)}</span>
          </div>
          <span class="category-count">${filteredItems.length}</span>
        </div>
        <div class="tech-grid">
          ${filteredItems
            .map((tech) => {
              const expanded = showAllEvidence || Boolean(currentSearchQuery);
              const iconSvg = getTechIcon(tech.id, cat.iconKey);
              return `
                <div class="tech-card ${expanded ? 'is-open' : ''}" data-tech-id="${esc(tech.id)}">
                  <div class="tech-card-top">
                    <div class="tech-left">
                      <div class="tech-icon-box">${iconSvg}</div>
                      <div class="tech-info">
                        <div class="tech-name-row">
                          <span class="tech-name">${esc(tech.name)}</span>
                          ${tech.version ? `<span class="version-pill">v${esc(tech.version)}</span>` : ''}
                        </div>
                        ${tech.description ? `<p class="tech-desc">${esc(tech.description)}</p>` : ''}
                      </div>
                    </div>
                    <div class="tech-meta-right">
                      <span class="proof-pill" title="Click to view how DeepStack detected ${esc(tech.name)}">
                        <span>${tech.confidence}%</span>
                        ${UI_ICONS.chevronDown}
                      </span>
                      ${(() => {
                        const safeHref = safeExternalUrl(tech.website);
                        return safeHref
                          ? `<a class="tech-link" href="${esc(safeHref)}" target="_blank" rel="noopener noreferrer" title="Learn more at ${esc(safeHref)}">${UI_ICONS.externalLink}</a>`
                          : '';
                      })()}
                    </div>
                  </div>
                  <div class="evidence-list ${expanded ? '' : 'hidden'}">
                    ${tech.evidence
                      .map(
                        (ev) => `
                        <div class="evidence-item">
                          <span class="evidence-badge">${esc(ev.type)}</span>
                          <span class="evidence-detail">${esc(ev.detail)}</span>
                        </div>
                      `
                      )
                      .join('')}
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      </div>
    `;
  }

  if (matchedCount === 0) {
    html = `<div class="section-card"><p class="section-subtitle" style="margin:0;">No detected technologies matched "${esc(currentSearchQuery)}".</p></div>`;
  }

  els.stackContainer.innerHTML = html;

  els.stackContainer.querySelectorAll('.tech-link').forEach((linkEl) => {
    linkEl.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });

  els.stackContainer.querySelectorAll('.tech-card-top').forEach((headerEl) => {
    headerEl.addEventListener('click', () => {
      const card = headerEl.closest('.tech-card');
      const evList = card?.querySelector('.evidence-list');
      if (evList) {
        const isHidden = evList.classList.toggle('hidden');
        card.classList.toggle('is-open', !isHidden);
      }
    });
  });
}

// =========================================================
// PANEL 2: APP INTERNALS
// =========================================================
function renderInternalsPanel(report) {
  const react = report.internals?.react || {};
  const fw = report.internals?.frameworkInternals || {};
  const caps = report.internals?.capabilities || {};
  const sections = [];

  sections.push(`
    <div class="section-card">
      <div class="section-header">
        <span class="section-title">Page Rendering & JavaScript Runtime</span>
      </div>
      <p class="section-subtitle">How the browser receives, builds, and hydrates the user interface.</p>
      <div class="kv-grid">
        <div class="kv-key">Rendering Method</div>
        <div class="kv-val">${esc(fw.renderingStrategy || 'Standard HTML / Client JS')}</div>
        ${
          fw.bundler
            ? `
          <div class="kv-key">Module Bundler</div>
          <div class="kv-val">${esc(fw.bundler.name)} ${fw.bundler.appName ? `(${esc(fw.bundler.appName)})` : ''}${fw.bundler.loadedChunkCount ? ` · ${fw.bundler.loadedChunkCount} JS chunks` : ''}</div>
        `
            : ''
        }
        ${
          react.detected
            ? `
          <div class="kv-key">React Engine</div>
          <div class="kv-val">${esc(react.version ? `v${react.version}` : 'Active')} · ${esc(react.mode || 'Standard Fiber')}</div>
        `
            : ''
        }
      </div>
    </div>
  `);

  const fMap = fw.frameworks || {};
  if (fMap.nextjs) {
    const n = fMap.nextjs;
    sections.push(`
      <div class="section-card">
        <div class="section-header">
          <span class="section-title">Next.js Application Telemetry</span>
          ${n.version ? `<span class="section-badge">v${esc(n.version)}</span>` : ''}
        </div>
        <p class="section-subtitle">Internal routing and server-rendering metadata exposed by Next.js.</p>
        <div class="kv-grid">
          <div class="kv-key">Router Type</div>
          <div class="kv-val">${esc(n.router)}</div>
          ${n.buildId ? `<div class="kv-key">Deployment Build ID</div><div class="kv-val">${esc(n.buildId)}</div>` : ''}
          ${n.page ? `<div class="kv-key">Active Route Pattern</div><div class="kv-val">${esc(n.page)}</div>` : ''}
          <div class="kv-key">Server Payload</div>
          <div class="kv-val">${n.rscPayloadChunks > 0 ? `React Server Components (${n.rscPayloadChunks} stream chunks)` : n.ssr ? 'Dynamic Server-Side Rendered (SSR)' : n.ssg ? 'Pre-rendered Static Page (SSG)' : 'Automatic Static'}</div>
          ${n.locale ? `<div class="kv-key">Active Locale</div><div class="kv-val">${esc(n.locale)}</div>` : ''}
        </div>
      </div>
    `);
  }

  if (fMap.astro) {
    const a = fMap.astro;
    sections.push(`
      <div class="section-card">
        <div class="section-header">
          <span class="section-title">Astro Islands Architecture</span>
          <span class="section-badge">${a.islandCount} islands</span>
        </div>
        <p class="section-subtitle">Static HTML page with isolated interactive UI islands.</p>
        <div class="kv-grid">
          <div class="kv-key">Interactive Islands</div>
          <div class="kv-val">${a.islandCount} hydrated components</div>
          <div class="kv-key">Loading Triggers</div>
          <div class="kv-val">${esc(JSON.stringify(a.hydrationDirectives))}</div>
        </div>
      </div>
    `);
  }

  if (fMap.shopify) {
    const s = fMap.shopify;
    sections.push(`
      <div class="section-card">
        <div class="section-header">
          <span class="section-title">Shopify Storefront Details</span>
        </div>
        <p class="section-subtitle">Storefront configuration and active Liquid theme metadata.</p>
        <div class="kv-grid">
          ${s.shop ? `<div class="kv-key">Store Identifier</div><div class="kv-val">${esc(s.shop)}</div>` : ''}
          ${s.themeName ? `<div class="kv-key">Active Theme</div><div class="kv-val">${esc(s.themeName)} (ID: ${esc(s.themeId || 'n/a')})</div>` : ''}
          ${s.currency ? `<div class="kv-key">Active Currency</div><div class="kv-val">${esc(s.currency)} (${esc(s.country || 'Global')})</div>` : ''}
        </div>
      </div>
    `);
  }

  const sw = caps.serviceWorker || {};
  const storage = caps.storage || {};
  sections.push(`
    <div class="section-card">
      <div class="section-header">
        <span class="section-title">Offline Workers & Browser Databases</span>
      </div>
      <p class="section-subtitle">Background workers and client-side databases used for caching and offline state.</p>
      <div class="kv-grid">
        <div class="kv-key">Service Worker</div>
        <div class="kv-val">${sw.active ? `Active (${esc(sw.scriptURL || 'registered')})` : 'Not used'}</div>
        <div class="kv-key">IndexedDB Databases</div>
        <div class="kv-val">${storage.indexedDbNames?.length ? esc(storage.indexedDbNames.join(', ')) : 'None'}</div>
        <div class="kv-key">Cache Storage</div>
        <div class="kv-val">${storage.cacheStorageNames?.length ? esc(storage.cacheStorageNames.join(', ')) : 'None'}</div>
      </div>
    </div>
  `);

  const lsKeys = storage.localStorageKeys || [];
  const ssKeys = storage.sessionStorageKeys || [];
  sections.push(`
    <div class="section-card">
      <div class="section-header">
        <span class="section-title">Local & Session Storage Keys</span>
        <span class="section-badge">${lsKeys.length + ssKeys.length} keys</span>
      </div>
      <p class="section-subtitle">Key names stored in your browser by the site's frontend scripts (values are never read).</p>
      ${
        lsKeys.length + ssKeys.length > 0
          ? `<div class="tag-cloud">
              ${lsKeys.slice(0, 30).map((k) => `<span class="tag-chip" title="localStorage key">${esc(k)}</span>`).join('')}
              ${ssKeys.slice(0, 15).map((k) => `<span class="tag-chip" title="sessionStorage key">${esc(k)}</span>`).join('')}
            </div>`
          : `<p class="section-subtitle" style="margin:0;">No local or session storage keys set by this page.</p>`
      }
    </div>
  `);

  els.internalsContainer.innerHTML = sections.join('');
}

// =========================================================
// PANEL 3: NETWORK, PERFORMANCE & HIDDEN CSP INFRASTRUCTURE
// =========================================================
function renderNetworkPanel(report) {
  const net = report.networkArchitecture || {};
  const dns = report.dnsInfrastructure || null;
  const sections = [];

  if (dns && (dns.cnameChain?.length || dns.emailProvider || dns.spfSenders?.length || dns.verifiedServices?.length || dns.ipAddresses?.length)) {
    sections.push(`
      <div class="section-card">
        <div class="section-header">
          <span class="section-title">DNS, Backend Routing & Corporate Stack</span>
          <span class="section-badge">${esc(dns.apexDomain || report.hostname)}</span>
        </div>
        <p class="section-subtitle">Infrastructure, email providers, and enterprise SaaS verified via live DNS-over-HTTPS (CNAME, MX, SPF, TXT).</p>
        <div class="kv-grid">
          ${
            dns.cnameProvider
              ? `<div class="kv-key">CNAME Host Target</div><div class="kv-val">${esc(dns.cnameProvider.provider)} (${esc(dns.cnameProvider.target)})</div>`
              : dns.cnameChain?.length
              ? `<div class="kv-key">CNAME Chain</div><div class="kv-val">${esc(dns.cnameChain.join(' → '))}</div>`
              : ''
          }
          ${
            dns.ipAddresses?.length
              ? `<div class="kv-key">Resolved Server IPs</div><div class="kv-val">${esc(dns.ipAddresses.join(', '))}</div>`
              : ''
          }
          ${
            dns.emailProvider
              ? `<div class="kv-key">Corporate Email (MX)</div><div class="kv-val">${esc(dns.emailProvider)}</div>`
              : ''
          }
          ${
            dns.spfSenders?.length
              ? `<div class="kv-key">Outbound Email (SPF)</div><div class="kv-val">${esc(dns.spfSenders.join(', '))}</div>`
              : ''
          }
        </div>
        ${
          dns.verifiedServices?.length
            ? `<div style="margin-top:9px;padding-top:8px;border-top:1px solid var(--border);">
                <div style="font-size:11px;color:var(--text-muted);margin-bottom:5px;">Domain-Verified Enterprise Services (DNS TXT):</div>
                <div class="tag-cloud">
                  ${dns.verifiedServices.map((s) => `<span class="tag-chip status-pass-chip">${esc(s)}</span>`).join('')}
                </div>
              </div>`
            : ''
        }
      </div>
    `);
  }

  sections.push(`
    <div class="section-card">
      <div class="section-header">
        <span class="section-title">Server Speed, Delivery & Compression</span>
        <span class="section-badge">${esc(net.speedRating || 'Measured')}</span>
      </div>
      <p class="section-subtitle">How fast the server responded and how the page was delivered over the network.</p>
      <div class="kv-grid">
        <div class="kv-key">Network Protocol</div>
        <div class="kv-val">${esc((net.protocol || 'HTTP').toUpperCase())}</div>
        <div class="kv-key">Server Response (TTFB)</div>
        <div class="kv-val">${net.ttfbMs !== null && net.ttfbMs !== undefined ? `${net.ttfbMs} ms (${esc(net.speedRating)})` : 'Not available'}</div>
        <div class="kv-key">Full Page Load</div>
        <div class="kv-val">${net.domCompleteMs ? `${net.domCompleteMs} ms` : '—'}</div>
        <div class="kv-key">CDN Cache Status</div>
        <div class="kv-val">${esc(net.cacheStatus || 'Not reported')}${net.ageSeconds ? ` (cached ${net.ageSeconds}s ago)` : ''}</div>
        <div class="kv-key">Compression</div>
        <div class="kv-val">${net.compression === 'br' ? 'Brotli (br)' : net.compression === 'zstd' ? 'Zstandard (zstd)' : net.compression === 'gzip' ? 'Gzip' : esc(net.compression || 'Standard')}</div>
        <div class="kv-key">HTML Transfer Size</div>
        <div class="kv-val">${formatBytes(net.transferSizeBytes)} (${formatBytes(net.decodedSizeBytes)} uncompressed)</div>
      </div>
    </div>
  `);

  const apis = net.apiEndpoints || [];
  sections.push(`
    <div class="section-card">
      <div class="section-header">
        <span class="section-title">Discovered Backend API Endpoints</span>
        <span class="section-badge">${apis.length}</span>
      </div>
      <p class="section-subtitle">Live data endpoints (REST, GraphQL, tRPC, or WebSockets) called by the page.</p>
      ${
        apis.length > 0
          ? `<div class="evidence-list" style="margin-top:0;border-top:none;padding-top:0;">
              ${apis
                .map(
                  (ep) => `
                  <div class="evidence-item">
                    <span class="evidence-badge">${esc(ep.kind)}</span>
                    <span class="evidence-detail">${esc(ep.host)}${esc(ep.path)}</span>
                  </div>
                `
                )
                .join('')}
            </div>`
          : `<p class="section-subtitle" style="margin:0;">No background API calls observed on this view yet.</p>`
      }
    </div>
  `);

  const dormant = net.dormantCspHosts || [];
  sections.push(`
    <div class="section-card">
      <div class="section-header">
        <span class="section-title">Whitelisted Services in Security Policy (CSP)</span>
        <span class="section-badge">${dormant.length}</span>
      </div>
      <p class="section-subtitle">
        External providers pre-authorized in the site's <code>Content-Security-Policy</code> header—often revealing payment gateways, analytics, or backend APIs used on other pages:
      </p>
      ${
        dormant.length > 0
          ? `<div class="tag-cloud">
              ${dormant.map((h) => `<span class="tag-chip status-warn-chip">${esc(h)}</span>`).join('')}
            </div>`
          : `<p class="section-subtitle" style="margin:0;">No additional dormant domains listed in CSP.</p>`
      }
    </div>
  `);

  const extDomains = net.externalDomains || [];
  sections.push(`
    <div class="section-card">
      <div class="section-header">
        <span class="section-title">Active Third-Party Domains Contacted</span>
        <span class="section-badge">${extDomains.length}</span>
      </div>
      <p class="section-subtitle">External servers that loaded scripts, fonts, images, or tracking pixels on this page.</p>
      ${
        extDomains.length > 0
          ? `<div class="tag-cloud">
              ${extDomains
                .map((d) => `<span class="tag-chip" title="Resource types: ${esc(d.types.join(', '))}">${esc(d.host)} (${d.count})</span>`)
                .join('')}
            </div>`
          : `<p class="section-subtitle" style="margin:0;">No third-party domains contacted.</p>`
      }
    </div>
  `);

  els.networkContainer.innerHTML = sections.join('');
}

// =========================================================
// PANEL 4: SECURITY POSTURE, COOKIES & HEADERS
// =========================================================
function renderSecurityPanel(report) {
  const sec = report.securityAudit || {};
  const checks = sec.checks || [];
  const cookies = sec.cookieSummary || { total: 0, items: [] };
  const rawHeaders = sec.rawHeaders || {};

  const sections = [];

  sections.push(`
    <div class="section-card">
      <div class="section-header">
        <span class="section-title">Browser Security & Protection Audit</span>
        <span class="section-badge">Grade ${esc(sec.grade || '—')} · ${sec.score ?? 0}/100</span>
      </div>
      <p class="section-subtitle">Evaluates whether the website enables modern browser defenses against common web attacks.</p>
      <div class="security-list">
        ${checks
          .map((c) => {
            const icon = UI_ICONS[c.status] || UI_ICONS.info;
            return `
              <div class="security-row">
                <div class="security-left">
                  <span class="status-icon ${esc(c.status)}">${icon}</span>
                  <div>
                    <div class="security-name">${esc(c.name)}</div>
                    <div class="security-explain">${esc(c.explanation || '')}</div>
                  </div>
                </div>
                <span class="security-val">${esc(c.value)}</span>
              </div>
            `;
          })
          .join('')}
      </div>
    </div>
  `);

  sections.push(`
    <div class="section-card">
      <div class="section-header">
        <span class="section-title">Cookies & Session Security</span>
        <span class="section-badge">${cookies.total} total · ${cookies.httpOnlyCount || 0} HttpOnly</span>
      </div>
      <p class="section-subtitle">
        Cookies stored by this site. Cookies marked with a lock icon use <code>HttpOnly</code>, protecting them from being stolen by malicious JavaScript.
      </p>
      ${
        cookies.items.length > 0
          ? `<div class="tag-cloud">
              ${cookies.items
                .map(
                  (c) =>
                    `<span class="tag-chip ${c.httpOnly ? 'status-pass-chip' : ''}" title="Domain: ${esc(c.domain)} | Secure: ${c.secure} | HttpOnly: ${c.httpOnly} | SameSite: ${esc(c.sameSite)}">
                      ${c.httpOnly ? UI_ICONS.lock : ''}
                      <span>${esc(c.name)}</span>
                    </span>`
                )
                .join('')}
            </div>`
          : `<p class="section-subtitle" style="margin:0;">No cookies stored by this page.</p>`
      }
    </div>
  `);

  const headerEntries = Object.entries(rawHeaders).sort((a, b) => a[0].localeCompare(b[0]));
  sections.push(`
    <div class="section-card">
      <div class="section-header">
        <span class="section-title">Raw HTTP Response Headers</span>
        <span class="section-badge">${headerEntries.length}</span>
      </div>
      <p class="section-subtitle">Complete server response headers returned for this page.</p>
      ${
        headerEntries.length > 0
          ? `<div class="kv-grid">
              ${headerEntries
                .map(
                  ([k, v]) => `
                  <div class="kv-key">${esc(k)}</div>
                  <div class="kv-val">${esc(String(v).slice(0, 180))}</div>
                `
                )
                .join('')}
            </div>`
          : `<p class="section-subtitle" style="margin:0;">No HTTP headers captured.</p>`
      }
    </div>
  `);

  els.securityContainer.innerHTML = sections.join('');
}

// =========================================================
// PANEL 5: DESIGN SYSTEM, TYPOGRAPHY & SEO
// =========================================================
function renderDesignPanel(report) {
  const ds = report.designSystem || {};
  const seo = report.metaAndSeo || {};
  const fontsLoaded = report.internals?.capabilities?.fonts || [];
  const sections = [];

  const palette = ds.palette || [];
  sections.push(`
    <div class="section-card">
      <div class="section-header">
        <span class="section-title">Active Color Palette</span>
        <span class="section-badge">Click swatch to copy HEX</span>
      </div>
      <p class="section-subtitle">Primary background, text, and accent colors computed across key page elements.</p>
      ${
        palette.length > 0
          ? `<div class="swatch-grid">
              ${palette
                .map((p) => {
                  const hex = safeHexColor(p.hex);
                  return `
                  <div class="swatch-item" data-hex="${esc(hex)}" title="Click to copy ${esc(hex)}">
                    <div class="swatch-color" style="background-color: ${hex};"></div>
                    <span class="swatch-hex">${esc(hex)}</span>
                  </div>
                `;
                })
                .join('')}
            </div>`
          : `<p class="section-subtitle" style="margin:0;">No computed colors extracted.</p>`
      }
    </div>
  `);

  const typo = ds.typography || {};
  sections.push(`
    <div class="section-card">
      <div class="section-header">
        <span class="section-title">Typography & Fonts</span>
      </div>
      <p class="section-subtitle">Font families and sizes rendered on headings, body copy, and code blocks.</p>
      <div class="kv-grid">
        ${
          typo.heading
            ? `<div class="kv-key">Heading Font</div>
               <div class="kv-val">${esc(typo.heading.family)} · ${esc(typo.heading.size)} (weight ${esc(typo.heading.weight)})</div>`
            : ''
        }
        ${
          typo.body
            ? `<div class="kv-key">Body Font</div>
               <div class="kv-val">${esc(typo.body.family)} · ${esc(typo.body.size)} (weight ${esc(typo.body.weight)})</div>`
            : ''
        }
        ${
          typo.code
            ? `<div class="kv-key">Monospace Font</div>
               <div class="kv-val">${esc(typo.code.family)}</div>`
            : ''
        }
        <div class="kv-key">Theme / Dark Mode</div>
        <div class="kv-val">
          ${
            ds.darkMode?.dataTheme
              ? `Attribute data-theme="${esc(ds.darkMode.dataTheme)}"`
              : ds.darkMode?.htmlClassDark
              ? 'CSS class .dark on root'
              : `color-scheme: ${esc(ds.darkMode?.colorScheme || 'light/default')}`
          }
        </div>
      </div>
      ${
        fontsLoaded.length > 0
          ? `<div style="margin-top:10px;">
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:5px;">Loaded Web Fonts (${fontsLoaded.length}):</div>
              <div class="tag-cloud">
                ${fontsLoaded.map((f) => `<span class="tag-chip">${esc(f)}</span>`).join('')}
              </div>
            </div>`
          : ''
      }
    </div>
  `);

  const rootVars = ds.rootVariables || [];
  if (rootVars.length > 0) {
    sections.push(`
      <div class="section-card">
        <div class="section-header">
          <span class="section-title">CSS Design System Tokens (:root)</span>
          <span class="section-badge">${rootVars.length}</span>
        </div>
        <p class="section-subtitle">Custom CSS variables defined at the root of the stylesheet.</p>
        <div class="kv-grid">
          ${rootVars
            .slice(0, 18)
            .map(
              (v) => `
              <div class="kv-key">${esc(v.name)}</div>
              <div class="kv-val">${esc(v.value)}</div>
            `
            )
            .join('')}
        </div>
      </div>
    `);
  }

  const schemas = seo.jsonLdSchemas || [];
  const meta = seo.meta || {};
  sections.push(`
    <div class="section-card">
      <div class="section-header">
        <span class="section-title">SEO & Structured Data</span>
      </div>
      <p class="section-subtitle">Search engine metadata, OpenGraph tags, and Schema.org structured entities.</p>
      <div class="kv-grid">
        <div class="kv-key">Schema.org Entities</div>
        <div class="kv-val">${schemas.length > 0 ? esc(schemas.join(', ')) : 'None detected'}</div>
        ${seo.canonicalUrl ? `<div class="kv-key">Canonical URL</div><div class="kv-val">${esc(seo.canonicalUrl)}</div>` : ''}
        ${seo.pwaManifestUrl ? `<div class="kv-key">Web App Manifest</div><div class="kv-val">${esc(seo.pwaManifestUrl)}</div>` : ''}
        ${meta['og:site_name'] ? `<div class="kv-key">Site Name (OG)</div><div class="kv-val">${esc(meta['og:site_name'])}</div>` : ''}
        ${meta['og:type'] ? `<div class="kv-key">Content Type (OG)</div><div class="kv-val">${esc(meta['og:type'])}</div>` : ''}
        ${meta['generator'] ? `<div class="kv-key">Generator Tag</div><div class="kv-val">${esc(meta['generator'])}</div>` : ''}
      </div>
    </div>
  `);

  els.designContainer.innerHTML = sections.join('');

  els.designContainer.querySelectorAll('.swatch-item').forEach((el) => {
    el.addEventListener('click', () => {
      const hex = el.getAttribute('data-hex');
      if (hex) {
        navigator.clipboard.writeText(hex).then(() => showToast(`Copied ${hex}`));
      }
    });
  });
}

// =========================================================
// EXPORT REPORT AS MARKDOWN
// =========================================================
function generateMarkdownReport(report) {
  const lines = [];
  lines.push(`# DeepStack Architecture Report — ${report.hostname || report.url}`);
  lines.push('');
  lines.push(`> ${report.executiveSummary || ''}`);
  lines.push('');
  lines.push(`- **URL:** ${report.url}`);
  lines.push(`- **Rendering Strategy:** ${report.internals?.frameworkInternals?.renderingStrategy || 'Standard'}`);
  lines.push(`- **HTTP Protocol:** ${(report.networkArchitecture?.protocol || 'HTTP').toUpperCase()}`);
  lines.push(`- **Security Posture:** Grade ${report.securityAudit?.grade || '—'} (${report.securityAudit?.score ?? 0}/100)`);
  lines.push(`- **Total Technologies Detected:** ${report.totalDetected}`);
  lines.push('');

  lines.push('## Detected Technology Stack');
  for (const cat of report.categories || []) {
    lines.push(`### ${cat.label}`);
    for (const t of cat.items) {
      const ver = t.version ? ` \`v${t.version}\`` : '';
      const proofs = t.evidence.map((e) => `${e.type}: ${e.detail}`).join(' | ');
      lines.push(`- **${t.name}**${ver} — ${t.description} _(${t.confidence}% confidence via ${proofs})_`);
    }
    lines.push('');
  }

  if (report.networkArchitecture?.apiEndpoints?.length) {
    lines.push('## Discovered API & Realtime Endpoints');
    for (const ep of report.networkArchitecture.apiEndpoints) {
      lines.push(`- **[${ep.kind}]** \`${ep.host}${ep.path}\``);
    }
    lines.push('');
  }

  if (report.networkArchitecture?.dormantCspHosts?.length) {
    lines.push('## Whitelisted Services in CSP');
    lines.push(report.networkArchitecture.dormantCspHosts.map((h) => `\`${h}\``).join(', '));
    lines.push('');
  }

  return lines.join('\n');
}

// Initialize inspection on popup open
inspectCurrentTab(false);
