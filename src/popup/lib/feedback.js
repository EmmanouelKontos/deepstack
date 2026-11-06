/** Toast notifications, clipboard and file download helpers. */

let toastTimer = null;

export function showToast(message, tone = 'default') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.dataset.tone = tone;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), 1800);
}

export async function copyText(text, successMessage = 'Copied to clipboard') {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage);
    return true;
  } catch {
    showToast('Clipboard access was blocked', 'error');
    return false;
  }
}

export function downloadText(filename, text, mime = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type: `${mime};charset=utf-8` }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast(`Saved ${filename}`);
}

/** Any element with data-copy="value" inside root copies that value on click or Enter. */
export function enableCopyDelegation(root) {
  const handle = (target) => {
    const el = target.closest('[data-copy]');
    if (!el || !root.contains(el)) return false;
    const value = el.getAttribute('data-copy');
    if (!value) return false;
    copyText(value, value.length > 48 ? 'Copied to clipboard' : `Copied ${value}`);
    return true;
  };
  root.addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    handle(e.target);
  });
  root.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-copy]')) {
      e.preventDefault();
      handle(e.target);
    }
  });
}
