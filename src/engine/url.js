/** Shortens a URL to host + abbreviated path for evidence labels. */
export function shortenUrl(url) {
  try {
    const u = new URL(url);
    const path = u.pathname.length > 48 ? u.pathname.slice(0, 22) + '…' + u.pathname.slice(-22) : u.pathname;
    return `${u.hostname}${path}`;
  } catch {
    return String(url).slice(0, 75);
  }
}
