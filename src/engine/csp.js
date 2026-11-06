/** Parses a Content-Security-Policy string into directives and external hosts. */
export function parseCspHeader(cspString) {
  const result = {
    present: Boolean(cspString && cspString.trim()),
    directives: {},
    allExternalHosts: [],
    hasUnsafeInline: false,
    hasUnsafeEval: false
  };
  if (!result.present) return result;

  const hostSet = new Set();
  const parts = cspString.split(';').map(s => s.trim()).filter(Boolean);
  for (const part of parts) {
    const tokens = part.split(/\s+/);
    const dirName = tokens[0].toLowerCase();
    const values = tokens.slice(1);
    result.directives[dirName] = values;

    for (const val of values) {
      if (val.includes("'unsafe-inline'")) result.hasUnsafeInline = true;
      if (val.includes("'unsafe-eval'")) result.hasUnsafeEval = true;

      const cleaned = val
        .replace(/^[a-z]+:\/\//i, '')
        .replace(/^\*\./, '')
        .replace(/\/.*$/, '')
        .replace(/:\d+$/, '');
      if (cleaned && cleaned.includes('.') && !cleaned.startsWith("'") && !cleaned.includes('*')) {
        hostSet.add(cleaned.toLowerCase());
      }
    }
  }

  result.allExternalHosts = Array.from(hostSet).slice(0, 60);
  return result;
}
