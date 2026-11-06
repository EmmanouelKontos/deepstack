/** Theme preference: 'system' follows prefers-color-scheme. Stored in localStorage so it applies before first paint. */

const KEY = 'deepstack_theme';
const VALID = new Set(['system', 'light', 'dark']);

export function getThemePreference() {
  try {
    const value = localStorage.getItem(KEY);
    return VALID.has(value) ? value : 'system';
  } catch {
    return 'system';
  }
}

export function applyTheme(pref) {
  const value = VALID.has(pref) ? pref : 'system';
  if (value === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', value);
  try {
    localStorage.setItem(KEY, value);
  } catch {
    // Storage blocked; the choice still applies for this session.
  }
  return value;
}
