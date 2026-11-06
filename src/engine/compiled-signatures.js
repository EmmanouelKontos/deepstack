import { SIGNATURES } from './signatures.js';

/** Signature regexes are compiled once at module load so the per-page hot loop allocates nothing. */

function compileRegexList(list) {
  if (!Array.isArray(list)) return null;
  return list
    .map((pat) => {
      try {
        return new RegExp(pat, 'i');
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function compileRegexMap(mapObj) {
  if (!mapObj || typeof mapObj !== 'object') return null;
  const compiled = [];
  for (const [key, pat] of Object.entries(mapObj)) {
    try {
      compiled.push([key.toLowerCase(), key, new RegExp(pat, 'i')]);
    } catch {}
  }
  return compiled.length > 0 ? compiled : null;
}

/**
 * Version-from-URL matcher, e.g. jquery-3.7.1.min.js, /npm/vue@3.4.0/, /libs/gsap/3.12.5/, jquery.min.js?ver=3.7.1.
 * The slug must start at a path/package boundary and be followed only by build suffixes, so
 * "vue-router@4" is not read as Vue 4 and "preact@10" is not read as React 10.
 */
function buildUrlVersionRegex(id) {
  const slug = id.replace(/_/g, '[-_.]?');
  try {
    return new RegExp(
      `(?:^|[/@._-])${slug}(?:[.-](?:min|umd|prod|production|global|bundle|esm))*(?:@|/|-|\\.js\\?ver=|\\?ver=)v?(\\d+\\.\\d+(?:\\.\\d+)?)`,
      'i'
    );
  } catch {
    return null;
  }
}

export const COMPILED_SIGNATURES = SIGNATURES.map((sig) => ({
  ...sig,
  _headers: compileRegexMap(sig.headers),
  _cookies: compileRegexList(sig.cookies),
  _scripts: compileRegexList(sig.scripts),
  _links: compileRegexList(sig.links),
  _meta: compileRegexMap(sig.meta),
  _storage: compileRegexList(sig.storage),
  _network: compileRegexList(sig.network),
  _urlVerRe: buildUrlVersionRegex(sig.id)
}));

export const SIG_BY_ID = new Map(COMPILED_SIGNATURES.map((s) => [s.id, s]));
