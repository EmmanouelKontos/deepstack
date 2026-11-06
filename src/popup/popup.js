import { UI_ICONS } from './icons.js';
import { activateTab, closeMenus, currentTab, setupMenu, setupShortcuts, setupTabs, TAB_ORDER } from './lib/controls.js';
import { esc, formatMs } from './lib/dom.js';
import { reportFilename, toJson, toMarkdown } from './lib/export.js';
import { copyText, downloadText, enableCopyDelegation } from './lib/feedback.js';
import { applyTheme, getThemePreference } from './lib/theme.js';
import { renderDesignPanel } from './panels/design.js';
import { renderInternalsPanel } from './panels/internals.js';
import { renderNetworkPanel } from './panels/network.js';
import { gradeTone, renderSecurityPanel } from './panels/security.js';
import { bindStackInteractions, renderStackPanel, setStackQuery, toggleAllEvidence } from './panels/stack.js';
import { getSettings, updateSettings } from '../shared/settings.js';

/** DeepStack popup controller: runs the inspection, renders panels, wires controls. */

const $ = (id) => document.getElementById(id);
const VERSION = chrome.runtime.getManifest().version;
const SPEED_TONE = { Fast: 'pass', Moderate: 'warn', Slow: 'fail' };

let report = null;
let activeTabId = null;

/* ---------- static chrome ---------- */

$('brand-logo').innerHTML = UI_ICONS.brandLogo;
$('btn-rescan').innerHTML = UI_ICONS.refresh;
$('btn-export').innerHTML = UI_ICONS.download;
$('btn-settings').innerHTML = UI_ICONS.settings;
$('search-icon').innerHTML = UI_ICONS.search;
$('icon-github').innerHTML = UI_ICONS.github;
$('icon-coffee').innerHTML = UI_ICONS.coffee;
$('footer-meta').textContent = `v${VERSION}`;

function syncThemeButtons(pref) {
  document.querySelectorAll('[data-theme-choice]').forEach((b) => {
    b.setAttribute('aria-checked', String(b.dataset.themeChoice === pref));
  });
}
syncThemeButtons(applyTheme(getThemePreference()));

/* ---------- state views ---------- */

function setView(view) {
  $('content').setAttribute('aria-busy', String(view === 'loading'));
  $('state-loading').hidden = view !== 'loading';
  $('state-error').hidden = view !== 'error';
  $('btn-export').disabled = view !== 'report';
  $('btn-rescan').classList.toggle('is-spinning', view === 'loading');
  document.querySelector('.tabs').classList.toggle('is-inactive', view !== 'report');
  for (const id of TAB_ORDER) {
    const panel = $(`panel-${id}`);
    panel.dataset.ready = String(view === 'report');
    panel.hidden = view !== 'report' || id !== currentTab();
  }
  if (view === 'loading') {
    for (const id of ['m-tech', 'm-ttfb', 'm-proto', 'm-sec']) $(id).innerHTML = '<i class="sk sk-sm"></i>';
  }
}

function showError({ title, desc, retry = true }) {
  setView('error');
  $('error-icon').innerHTML = UI_ICONS.warn;
  $('error-title').textContent = title;
  $('error-desc').textContent = desc;
  $('btn-retry').hidden = !retry;
  for (const id of ['m-tech', 'm-ttfb', 'm-proto', 'm-sec']) $(id).textContent = '—';
}

/* ---------- rendering ---------- */

function renderMetrics(r) {
  const net = r.networkArchitecture || {};
  const sec = r.securityAudit || {};
  $('m-tech').textContent = String(r.totalDetected);
  $('m-ttfb').innerHTML =
    typeof net.ttfbMs === 'number'
      ? `<span class="dot" data-tone="${SPEED_TONE[net.speedRating] || 'muted'}"></span>${esc(formatMs(net.ttfbMs))}`
      : '<span class="dim">n/a</span>';
  $('m-proto').textContent = (net.protocol || 'http').toUpperCase();
  $('m-sec').innerHTML = sec.headersMissing
    ? '<span class="dim">No headers</span>'
    : `<span class="grade-chip" data-tone="${gradeTone(sec.grade)}">${esc(sec.grade || '—')}</span><span class="dim">${sec.score ?? 0}/100</span>`;
  $('count-stack').textContent = String(r.totalDetected);
  $('count-network').textContent = String((net.apiEndpoints?.length || 0) + (net.dormantCspHosts?.length || 0)) || '';
}

const stackEls = { overview: $('stack-overview'), list: $('stack-list'), evidenceToggle: $('btn-evidence') };

function renderReport(r) {
  $('host').textContent = r.hostname || 'This page';
  $('host').title = r.url || '';
  $('strategy').textContent = r.internals?.frameworkInternals?.renderingStrategy || 'Static HTML / client-side';
  $('footer-meta').textContent = `v${VERSION} · scanned ${new Date(r.analyzedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  renderMetrics(r);
  renderStackPanel(r, stackEls);
  renderInternalsPanel(r, $('panel-internals'));
  renderNetworkPanel(r, $('panel-network'));
  renderSecurityPanel(r, $('panel-security'));
  renderDesignPanel(r, $('panel-design'));
  setView('report');
}

/* ---------- inspection ---------- */

async function inspect() {
  setView('loading');
  closeMenus();
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw Object.assign(new Error('No active tab found.'), { code: 'error' });
    activeTabId = tab.id;
    if (!/^https?:\/\//i.test(tab.url || '')) {
      $('host').textContent = 'Browser page';
      $('strategy').textContent = 'Not inspectable';
      showError({
        title: "This page can't be inspected",
        desc: 'Browsers block extensions on internal pages such as settings, the new tab page and the extension store. Open any website and click DeepStack again.',
        retry: false
      });
      return;
    }
    $('host').textContent = new URL(tab.url).hostname;
    const res = await chrome.runtime.sendMessage({ type: 'DEEPSTACK_INSPECT_TAB', tabId: tab.id });
    if (!res?.ok || !res.report) {
      throw Object.assign(new Error(res?.error || 'The analysis did not return a result.'), { code: res?.code });
    }
    report = res.report;
    renderReport(report);
  } catch (err) {
    showError(
      err.code === 'restricted'
        ? { title: "This page can't be inspected", desc: err.message, retry: false }
        : { title: 'Inspection failed', desc: err.message || String(err) }
    );
  }
}

function reloadAndInspect() {
  if (activeTabId === null) return;
  setView('loading');
  const tabId = activeTabId;
  const done = () => {
    chrome.tabs.onUpdated.removeListener(onUpdated);
    clearTimeout(timer);
    setTimeout(inspect, 400);
  };
  const onUpdated = (id, info) => {
    if (id === tabId && info.status === 'complete') done();
  };
  const timer = setTimeout(done, 15000);
  chrome.tabs.onUpdated.addListener(onUpdated);
  chrome.tabs.reload(tabId).catch(done);
}

/* ---------- controls ---------- */

const EXPORTS = {
  'copy-md': () => copyText(toMarkdown(report), 'Markdown report copied'),
  'copy-json': () => copyText(toJson(report), 'JSON report copied'),
  'save-md': () => downloadText(reportFilename(report, 'md'), toMarkdown(report), 'text/markdown'),
  'save-json': () => downloadText(reportFilename(report, 'json'), toJson(report), 'application/json')
};

setupTabs();
setupMenu($('btn-export'), $('menu-export'));
setupMenu($('btn-settings'), $('menu-settings'));
enableCopyDelegation($('content'));
bindStackInteractions($('stack-list'));

$('menu-export').addEventListener('click', (e) => {
  const action = e.target.closest('[data-export]')?.dataset.export;
  if (action && report) {
    EXPORTS[action]();
    closeMenus();
  }
});

$('menu-settings').addEventListener('click', (e) => {
  const choice = e.target.closest('[data-theme-choice]')?.dataset.themeChoice;
  if (choice) syncThemeButtons(applyTheme(choice));
});

getSettings().then((s) => {
  $('toggle-dns').checked = s.dnsLookups;
});
$('toggle-dns').addEventListener('change', async (e) => {
  await updateSettings({ dnsLookups: e.target.checked });
  if (report) inspect();
});

$('content').addEventListener('click', async (e) => {
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (action === 'reload-page') reloadAndInspect();
  if (action === 'clear-search') clearSearch();
  if (action === 'enable-dns') {
    $('toggle-dns').checked = true;
    await updateSettings({ dnsLookups: true });
    inspect();
  }
});

function clearSearch() {
  $('search').value = '';
  setStackQuery('');
  if (report) renderStackPanel(report, stackEls);
}

$('search').addEventListener('input', (e) => {
  setStackQuery(e.target.value);
  if (report) renderStackPanel(report, stackEls);
});

function toggleEvidence() {
  const on = toggleAllEvidence();
  $('btn-evidence').textContent = on ? 'Hide evidence' : 'Show evidence';
  if (report) renderStackPanel(report, stackEls);
}
$('btn-evidence').addEventListener('click', toggleEvidence);
$('btn-rescan').addEventListener('click', inspect);
$('btn-retry').addEventListener('click', inspect);

setupShortcuts({
  search: () => {
    if (!report) return;
    activateTab('stack');
    $('search').focus();
    $('search').select();
  },
  escape: (typing) => {
    if ($('search').value) {
      clearSearch();
      return true;
    }
    if (typing) {
      $('search').blur();
      return true;
    }
    return false;
  },
  tab: (name) => report && activateTab(name),
  rescan: inspect,
  toggleEvidence: () => report && toggleEvidence(),
  copyMarkdown: () => report && EXPORTS['copy-md']()
});

inspect();
