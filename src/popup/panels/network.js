import { UI_ICONS } from '../icons.js';
import { chips, emptyLine, esc, formatBytes, formatMs, kvGrid, sectionCard } from '../lib/dom.js';

/** Network tab: DNS, delivery timings, API endpoints, CSP-allowed hosts and third parties. */

const COMPRESSION_LABELS = { br: 'Brotli', zstd: 'Zstandard', gzip: 'Gzip', deflate: 'Deflate' };

function headerSourceNotice(report) {
  if (report.headerSource === 'captured') return '';
  const text =
    report.headerSource === 'fallback'
      ? 'This tab loaded before DeepStack was running, so headers come from a separate request and API calls made earlier are missing.'
      : 'No response headers were captured for this tab.';
  return `<div class="notice" role="status">
    <span class="notice-icon">${UI_ICONS.info}</span>
    <p>${esc(text)}</p>
    <button class="btn btn-sm" type="button" data-action="reload-page">Reload page</button>
  </div>`;
}

function dnsCard(report) {
  const dns = report.dnsInfrastructure;
  if (!report.dnsLookupEnabled) {
    return sectionCard({
      title: 'DNS & hosting',
      subtitle: 'DNS lookups are turned off.',
      body: `<button class="btn btn-sm" type="button" data-action="enable-dns">Turn on DNS lookups</button>`
    });
  }
  const hasData =
    dns && (dns.cnameChain?.length || dns.emailProvider || dns.spfSenders?.length || dns.verifiedServices?.length || dns.ipAddresses?.length);
  if (!hasData) {
    return sectionCard({
      title: 'DNS & hosting',
      subtitle: 'Public DNS records for this domain.',
      body: emptyLine('No DNS answers were returned (the lookup may have timed out).')
    });
  }
  const cname = dns.cnameProvider
    ? `${dns.cnameProvider.provider} (${dns.cnameProvider.target})`
    : dns.cnameChain?.length
      ? dns.cnameChain.join(' → ')
      : null;
  return sectionCard({
    title: 'DNS & hosting',
    badge: dns.apexDomain || report.hostname,
    subtitle: 'Public CNAME, A, MX and TXT records, fetched via DNS-over-HTTPS. Only the domain name is sent.',
    body:
      kvGrid([
        ['Hosting (CNAME)', cname, { copy: dns.cnameProvider?.target || cname }],
        ['IP addresses', dns.ipAddresses?.join(', '), { copy: dns.ipAddresses?.join(', ') }],
        ['Email (MX)', dns.emailProvider, { mono: false }],
        ['Sends mail via (SPF)', dns.spfSenders?.join(', '), { mono: false }]
      ]) +
      (dns.verifiedServices?.length
        ? `<p class="sublabel">Domain verified with (TXT)</p>${chips(dns.verifiedServices, { tone: 'pass' })}`
        : '')
  });
}

export function renderNetworkPanel(report, container) {
  const net = report.networkArchitecture || {};
  const apis = net.apiEndpoints || [];
  const dormant = net.dormantCspHosts || [];
  const ext = net.externalDomains || [];

  const sections = [
    headerSourceNotice(report),
    sectionCard({
      title: 'Delivery & timing',
      badge: net.speedRating || '',
      subtitle: 'How quickly the server answered and how the document was delivered.',
      body: kvGrid([
        ['Protocol', (net.protocol || 'http').toUpperCase()],
        ['Server response', typeof net.ttfbMs === 'number' ? `${formatMs(net.ttfbMs)} TTFB` : 'Not measured'],
        ['First paint', typeof net.fcpMs === 'number' ? formatMs(net.fcpMs) : null],
        ['Page complete', typeof net.domCompleteMs === 'number' ? formatMs(net.domCompleteMs) : null],
        ['CDN cache', net.cacheStatus ? `${net.cacheStatus}${net.ageSeconds ? ` · age ${net.ageSeconds}s` : ''}` : 'Not reported'],
        ['Compression', COMPRESSION_LABELS[net.compression] || net.compression || 'None reported'],
        ['HTML size', net.transferSizeBytes ? `${formatBytes(net.transferSizeBytes)} (${formatBytes(net.decodedSizeBytes)} decoded)` : null],
        ['Subresources', net.totalResourceCount ? `${net.totalResourceCount} requests · ${formatBytes(net.totalResourceBytes)}` : null],
        ['Server timing', net.serverTiming?.length ? net.serverTiming.map((s) => `${s.name} ${s.duration}ms`).join(', ') : null]
      ])
    }),
    dnsCard(report),
    sectionCard({
      title: 'API endpoints',
      badge: apis.length,
      subtitle: 'Data requests the page made: REST, GraphQL, tRPC, WebSocket and event streams.',
      body: apis.length
        ? `<div class="rows">${apis
            .map(
              (ep) => `<div class="ev-row">
                <span class="ev-type">${esc(ep.kind)}</span>
                <span class="ev-detail mono" data-copy="https://${esc(ep.host)}${esc(ep.path)}" title="Click to copy URL">${ep.isSameOrigin ? '' : `<span class="dim">${esc(ep.host)}</span>`}${esc(ep.path)}</span>
              </div>`
            )
            .join('')}</div>`
        : emptyLine('No API calls observed yet. Interact with the page, then rescan.')
    }),
    sectionCard({
      title: 'Allowed by CSP, not yet contacted',
      badge: dormant.length,
      subtitle: 'Hosts the Content Security Policy pre-approves. They often reveal services used on other pages, such as checkout or support.',
      body: dormant.length ? chips(dormant, { tone: 'warn' }) : emptyLine('Every host in the policy was contacted, or there is no policy.')
    }),
    sectionCard({
      title: 'Third-party domains',
      badge: ext.length,
      subtitle: 'External hosts that served scripts, fonts, images or beacons to this page.',
      body: ext.length
        ? chips(ext.map((d) => ({ label: d.host, title: `${d.count} requests · ${d.types.join(', ')}` })))
        : emptyLine('No third-party requests observed.')
    })
  ];

  container.innerHTML = sections.join('');
}
