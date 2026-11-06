import { COMPILED_SIGNATURES } from './compiled-signatures.js';
import { shortenUrl } from './url.js';

/**
 * Runs every compiled signature against the collected page signals.
 * Each vector (JS global, DOM, CSS token, header, cookie, script, link, meta, storage, network/CSP)
 * contributes independent evidence with its own weight.
 */
export function matchSignatures(ctx, addEvidence) {
  const { jsSignals, domSignals, cssVarPrefixes, normHeaders, cookies, scripts, links, meta, storageKeys, allNetworkUrls, activeUrlSet } = ctx;

  for (const sig of COMPILED_SIGNATURES) {
    // 1. JS Global Probe
    if (sig.js && Object.hasOwn(jsSignals, sig.js) && jsSignals[sig.js] !== undefined) {
      const val = jsSignals[sig.js];
      const ver = typeof val === 'string' && val !== 'true' ? val : null;
      addEvidence(
        sig,
        'JS Runtime',
        ver ? `window.${sig.js} detected (v${ver})` : `Global window.${sig.js} object present`,
        85,
        ver
      );
    }

    // 2. DOM Selectors & Heuristics
    if (sig.dom && Object.hasOwn(domSignals, sig.dom) && domSignals[sig.dom]) {
      const ver = sig.id === 'angular' ? domSignals.angularVersion : (sig.id === 'styled_components' ? domSignals.styledComponentsVersion : null);
      addEvidence(
        sig,
        'DOM Markup',
        String(domSignals[sig.dom]),
        75,
        ver
      );
    }

    // 3. CSS Custom Properties
    if (sig.cssVar && Object.hasOwn(cssVarPrefixes, sig.cssVar) && cssVarPrefixes[sig.cssVar] > 0) {
      addEvidence(
        sig,
        'CSS Tokens',
        `${cssVarPrefixes[sig.cssVar]} matching :root CSS variables (--${sig.cssVar}-*)`,
        65
      );
    }

    // 4. HTTP Headers
    if (sig._headers) {
      for (const [lowerKey, origKey, re] of sig._headers) {
        const headerVal = normHeaders[lowerKey];
        if (typeof headerVal === 'string' && headerVal) {
          const match = headerVal.match(re);
          if (match) {
            addEvidence(
              sig,
              'HTTP Header',
              `${origKey}: ${headerVal.slice(0, 90)}`,
              90,
              match[1] || null
            );
          }
        }
      }
    }

    // 5. Cookies
    if (sig._cookies && cookies.length > 0) {
      for (const re of sig._cookies) {
        const matchedCookie = cookies.find(c => re.test(c.name));
        if (matchedCookie) {
          addEvidence(
            sig,
            'Cookie',
            `${matchedCookie.name}${matchedCookie.httpOnly ? ' (HttpOnly)' : ''}`,
            80
          );
        }
      }
    }

    // 6. Script URLs
    if (sig._scripts && scripts.length > 0) {
      for (const re of sig._scripts) {
        for (const sUrl of scripts) {
          const match = sUrl.match(re);
          if (match) {
            addEvidence(
              sig,
              'Script URL',
              shortenUrl(sUrl),
              80,
              match[1] || null
            );
            break;
          }
        }
      }
    }

    // 7. Link hrefs
    if (sig._links && links.length > 0) {
      for (const re of sig._links) {
        for (const lUrl of links) {
          const match = lUrl.match(re);
          if (match) {
            addEvidence(
              sig,
              'Link Tag',
              shortenUrl(lUrl),
              75,
              match[1] || null
            );
            break;
          }
        }
      }
    }

    // 8. Meta tags
    if (sig._meta) {
      for (const [lowerKey, origKey, re] of sig._meta) {
        const mVal = Object.hasOwn(meta, lowerKey) ? meta[lowerKey] : null;
        if (typeof mVal === 'string' && mVal) {
          const match = mVal.match(re);
          if (match) {
            addEvidence(
              sig,
              'Meta Tag',
              `<meta name="${origKey}" content="${mVal.slice(0, 70)}">`,
              90,
              match[1] || null
            );
          }
        }
      }
    }

    // 9. Web Storage Keys
    if (sig._storage && storageKeys.length > 0) {
      for (const re of sig._storage) {
        const matchedKey = storageKeys.find(k => re.test(k));
        if (matchedKey) {
          addEvidence(
            sig,
            'Web Storage',
            `Key "${matchedKey.slice(0, 50)}"`,
            75
          );
        }
      }
    }

    // 10. Network & CSP Subresources
    if (sig._network && allNetworkUrls.length > 0) {
      for (const re of sig._network) {
        for (const netUrl of allNetworkUrls) {
          if (re.test(netUrl)) {
            const isFromCsp = !activeUrlSet.has(netUrl);
            addEvidence(
              sig,
              isFromCsp ? 'CSP Policy' : 'Network Call',
              shortenUrl(netUrl),
              isFromCsp ? 65 : 85
            );
            break;
          }
        }
      }
    }
  }
}
