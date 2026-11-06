/** Tabs, dropdown menus and keyboard shortcuts for the popup chrome. */

export const TAB_ORDER = ['stack', 'internals', 'network', 'security', 'design'];

export function activateTab(name, { focus = false } = {}) {
  for (const id of TAB_ORDER) {
    const tab = document.getElementById(`tab-${id}`);
    const panel = document.getElementById(`panel-${id}`);
    const active = id === name;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    if (panel && panel.dataset.ready === 'true') panel.hidden = !active;
    if (active && focus) tab.focus();
  }
  document.getElementById('content').scrollTop = 0;
}

export function currentTab() {
  return TAB_ORDER.find((id) => document.getElementById(`tab-${id}`).getAttribute('aria-selected') === 'true') || 'stack';
}

export function setupTabs() {
  const list = document.querySelector('.tabs');
  list.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-tab]');
    if (tab) activateTab(tab.dataset.tab);
  });
  list.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const idx = TAB_ORDER.indexOf(currentTab());
    const next = TAB_ORDER[(idx + (e.key === 'ArrowRight' ? 1 : TAB_ORDER.length - 1)) % TAB_ORDER.length];
    activateTab(next, { focus: true });
  });
}

const openMenus = new Set();

export function closeMenus() {
  for (const { button, menu } of openMenus) {
    menu.hidden = true;
    button.setAttribute('aria-expanded', 'false');
  }
  openMenus.clear();
}

export function setupMenu(button, menu) {
  const entry = { button, menu };
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = menu.hidden;
    closeMenus();
    if (willOpen) {
      menu.hidden = false;
      button.setAttribute('aria-expanded', 'true');
      openMenus.add(entry);
      menu.querySelector('button, input')?.focus();
    }
  });
  menu.addEventListener('click', (e) => e.stopPropagation());
}

document.addEventListener('click', closeMenus);

/**
 * handlers: { search, escape, tab(name), rescan, toggleEvidence, copyMarkdown }
 * Single-key shortcuts are ignored while typing in an input.
 */
export function setupShortcuts(handlers) {
  window.addEventListener('keydown', (e) => {
    const typing = e.target instanceof HTMLInputElement && e.target.type !== 'checkbox';
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      handlers.search();
      return;
    }
    if (e.key === 'Escape') {
      if (openMenus.size) {
        const [first] = openMenus;
        closeMenus();
        first.button.focus();
        e.preventDefault();
        return;
      }
      if (handlers.escape(typing)) e.preventDefault();
      return;
    }
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    const key = e.key.toLowerCase();
    if (key === '/') {
      e.preventDefault();
      handlers.search();
    } else if (/^[1-5]$/.test(key)) {
      handlers.tab(TAB_ORDER[Number(key) - 1]);
    } else if (key === 'r') {
      handlers.rescan();
    } else if (key === 'e') {
      handlers.toggleEvidence();
    } else if (key === 'c') {
      handlers.copyMarkdown();
    }
  });
}
