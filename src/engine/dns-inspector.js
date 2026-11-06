/**
 * DeepStack DNS-over-HTTPS (DoH) & Backend Infrastructure Resolver
 * Queries Cloudflare DoH JSON API to uncover:
 * - CNAME hosting targets (AWS ALB/CloudFront, Vercel, Heroku, Render, Fly.io, Azure, WP Engine, etc.)
 * - MX corporate mail providers (Google Workspace, Microsoft 365, Proton Mail, Mimecast, Proofpoint)
 * - SPF transactional email engines (Amazon SES, SendGrid, Postmark, Mailgun, Resend, Mandrill)
 * - TXT domain verification tokens (OpenAI, Anthropic, Stripe, Atlassian, Slack, Notion, Linear, Figma)
 */

const dnsCache = new Map();

// Shared hosting domains where each subdomain is a different owner. Their apex TXT/MX records
// belong to the platform, not the site, so the site's own name is treated as its "apex".
const SHARED_HOST_SUFFIXES = [
  'github.io', 'gitlab.io', 'vercel.app', 'netlify.app', 'pages.dev', 'workers.dev', 'web.app',
  'firebaseapp.com', 'herokuapp.com', 'onrender.com', 'fly.dev', 'up.railway.app', 'railway.app',
  'azurewebsites.net', 'azurestaticapps.net', 'appspot.com', 'myshopify.com', 'wixsite.com',
  'squarespace.com', 'webflow.io', 'framer.website', 'framer.app', 'blogspot.com', 'wordpress.com',
  'surge.sh', 'glitch.me', 'replit.app', 'repl.co', 'carrd.co', 'notion.site', 'bubbleapps.io',
  'amplifyapp.com', 'cloudfront.net', 'ngrok.io', 'ngrok-free.app', 'deno.dev', 'supabase.co'
];

function extractApexDomain(hostname) {
  if (!hostname || !hostname.includes('.')) return hostname;
  const lower = hostname.toLowerCase();
  const shared = SHARED_HOST_SUFFIXES.find((s) => lower.endsWith(`.${s}`));
  if (shared) return lower.slice(0, -(shared.length + 1)).split('.').pop() + `.${shared}`;
  const parts = lower.split('.');
  if (parts.length <= 2) return lower;
  // Handle common two-part TLDs like .co.uk, .com.au, .co.jp
  const secondLast = parts[parts.length - 2];
  if (['co', 'com', 'org', 'net', 'gov', 'edu', 'ac'].includes(secondLast) && parts[parts.length - 1].length === 2) {
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
}

async function queryDoH(name, type = 'TXT') {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1000);
  try {
    const resp = await fetch(url, {
      headers: { Accept: 'application/dns-json' },
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!resp.ok) return [];
    const data = await resp.json();
    return Array.isArray(data.Answer) ? data.Answer : [];
  } catch {
    clearTimeout(timer);
    return [];
  }
}

export async function inspectDnsInfrastructure(hostname) {
  if (!hostname || hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return null;
  }

  const apex = extractApexDomain(hostname);
  const cacheKey = `${hostname}:${apex}`;
  if (dnsCache.has(cacheKey)) {
    const cached = dnsCache.get(cacheKey);
    if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
      return cached.result;
    }
  }

  const [hostAnswers, apexTxtAnswers, apexMxAnswers] = await Promise.all([
    queryDoH(hostname, 'A'),
    queryDoH(apex, 'TXT'),
    queryDoH(apex, 'MX')
  ]);

  // 1. CNAME Chain & IP Resolution
  const cnameChain = [];
  const ipAddresses = [];
  for (const ans of hostAnswers) {
    if (ans.type === 5 && ans.data) {
      cnameChain.push(String(ans.data).replace(/\.$/, '').toLowerCase());
    } else if (ans.type === 1 && ans.data) {
      ipAddresses.push(String(ans.data));
    }
  }

  // Infer hidden cloud / backend host from CNAME
  let cnameProvider = null;
  const cnameRules = [
    { pattern: /vercel-dns\.com$/, name: 'Vercel Edge Network' },
    { pattern: /cloudfront\.net$/, name: 'AWS CloudFront' },
    { pattern: /elb\.amazonaws\.com$|awsglobalaccelerator\.com$/, name: 'AWS Elastic Load Balancer (ALB/ELB)' },
    { pattern: /herokuapp\.com$|herokudns\.com$/, name: 'Heroku PaaS' },
    { pattern: /onrender\.com$/, name: 'Render Cloud' },
    { pattern: /up\.railway\.app$|railway\.app$/, name: 'Railway Cloud' },
    { pattern: /fly\.dev$/, name: 'Fly.io Edge' },
    { pattern: /azurewebsites\.net$|azurefd\.net$|trafficmanager\.net$/, name: 'Microsoft Azure' },
    { pattern: /appspot\.com$|googlehosted\.com$/, name: 'Google Cloud / App Engine' },
    { pattern: /wpengine\.com$|wpenginepowered\.com$/, name: 'WP Engine (Managed WordPress)' },
    { pattern: /kinsta\.cloud$/, name: 'Kinsta (Managed WordPress)' },
    { pattern: /pantheonsite\.io$/, name: 'Pantheon CMS Cloud' },
    { pattern: /myshopify\.com$/, name: 'Shopify Infrastructure' },
    { pattern: /webflow\.com$|webflow\.io$/, name: 'Webflow Hosting' },
    { pattern: /squarespace\.com$/, name: 'Squarespace' },
    { pattern: /ghost\.io$/, name: 'Ghost(Pro) Hosting' },
    { pattern: /netlify\.app$|netlifyglobalcdn\.com$/, name: 'Netlify Edge' },
    { pattern: /fastly\.net$/, name: 'Fastly CDN' },
    { pattern: /akamaiedge\.net$|akadns\.net$|akamai\.net$/, name: 'Akamai Edge' },
    { pattern: /cloudflare\.net$/, name: 'Cloudflare Network' }
  ];

  for (const cname of cnameChain) {
    for (const rule of cnameRules) {
      if (rule.pattern.test(cname)) {
        cnameProvider = { provider: rule.name, target: cname };
        break;
      }
    }
    if (cnameProvider) break;
  }

  // 2. MX Corporate Email Provider
  const mxRecords = apexMxAnswers
    .map(a => String(a.data || '').replace(/^\d+\s+/, '').replace(/\.$/, '').toLowerCase())
    .filter(Boolean);

  let emailProvider = null;
  const mxJoined = mxRecords.join(' ');
  if (mxJoined.includes('google.com') || mxJoined.includes('googlemail.com')) {
    emailProvider = 'Google Workspace (Gmail)';
  } else if (mxJoined.includes('outlook.com')) {
    emailProvider = 'Microsoft 365 (Exchange Online)';
  } else if (mxJoined.includes('protonmail.ch')) {
    emailProvider = 'Proton Mail';
  } else if (mxJoined.includes('pphosted.com')) {
    emailProvider = 'Proofpoint Enterprise Email Security';
  } else if (mxJoined.includes('mimecast.com')) {
    emailProvider = 'Mimecast Email Security';
  } else if (mxJoined.includes('messagingengine.com')) {
    emailProvider = 'Fastmail';
  } else if (mxJoined.includes('zoho.com')) {
    emailProvider = 'Zoho Mail';
  } else if (mxJoined.includes('amazonaws.com')) {
    emailProvider = 'Amazon WorkMail / AWS SES';
  } else if (mxJoined.includes('cloudflare.net')) {
    emailProvider = 'Cloudflare Email Routing';
  }

  // 3. TXT Records: SPF Transactional Mailers & Verified Enterprise SaaS
  const txtStrings = apexTxtAnswers
    .map(a => String(a.data || '').replace(/^"|"$/g, '').replace(/"\s*"/g, ''))
    .filter(Boolean);

  const spfSenders = new Set();
  const verifiedServices = new Set();

  const spfMap = [
    { match: 'amazonses.com', name: 'Amazon SES' },
    { match: 'sendgrid.net', name: 'Twilio SendGrid' },
    { match: 'mailgun.org', name: 'Mailgun' },
    { match: 'mtasv.net', name: 'Postmark' },
    { match: 'resend.com', name: 'Resend' },
    { match: 'mcsv.net', name: 'Mailchimp / Mandrill' },
    { match: 'mandrillapp.com', name: 'Mandrill' },
    { match: 'hubspotemail.net', name: 'HubSpot Email' },
    { match: 'zendesk.com', name: 'Zendesk Mail' },
    { match: 'salesforce.com', name: 'Salesforce' },
    { match: 'customeriomail.com', name: 'Customer.io' },
    { match: 'sparkpostmail.com', name: 'SparkPost' },
    { match: 'klaviyo.com', name: 'Klaviyo' },
    { match: 'intercom.io', name: 'Intercom' },
    { match: 'freshdesk.com', name: 'Freshdesk' }
  ];

  const txtVerificationRules = [
    { re: /^openai-domain-verification=/i, name: 'OpenAI Enterprise' },
    { re: /^anthropic-domain-verification=/i, name: 'Anthropic Enterprise' },
    { re: /^stripe-verification=/i, name: 'Stripe' },
    { re: /^atlassian-domain-verification=/i, name: 'Atlassian Cloud (Jira / Confluence)' },
    { re: /^slack-domain-verification=/i, name: 'Slack Enterprise' },
    { re: /^notion-domain-verification=/i, name: 'Notion' },
    { re: /^linear-domain-verification=/i, name: 'Linear' },
    { re: /^figma-domain-verification=/i, name: 'Figma Organization' },
    { re: /^miro-verification=/i, name: 'Miro' },
    { re: /^zoom-domain-verification=/i, name: 'Zoom' },
    { re: /^docusign=/i, name: 'DocuSign' },
    { re: /^hubspot-(?:developer|site)-verification=/i, name: 'HubSpot' },
    { re: /^MS=ms\d+/i, name: 'Microsoft 365 / Entra ID' },
    { re: /^google-site-verification=/i, name: 'Google Search Console' },
    { re: /^apple-domain-verification=/i, name: 'Apple Business / Sign in with Apple' },
    { re: /^facebook-domain-verification=/i, name: 'Meta Business Suite' },
    { re: /^cursor-domain-verification=/i, name: 'Cursor Enterprise' },
    { re: /^vercel-domain-verification=/i, name: 'Vercel' },
    { re: /^cloudflare-verify=/i, name: 'Cloudflare' },
    { re: /^1password-site-verification=/i, name: '1Password Business' },
    { re: /^canva-site-verification=/i, name: 'Canva Enterprise' }
  ];

  for (const txt of txtStrings) {
    if (txt.toLowerCase().startsWith('v=spf1')) {
      const lower = txt.toLowerCase();
      for (const s of spfMap) {
        if (lower.includes(s.match)) {
          spfSenders.add(s.name);
        }
      }
    }

    for (const rule of txtVerificationRules) {
      if (rule.re.test(txt)) {
        verifiedServices.add(rule.name);
      }
    }
  }

  const result = {
    apexDomain: apex,
    cnameChain,
    cnameProvider,
    ipAddresses: ipAddresses.slice(0, 6),
    emailProvider,
    mxRecords: mxRecords.slice(0, 5),
    spfSenders: Array.from(spfSenders),
    verifiedServices: Array.from(verifiedServices)
  };

  if (dnsCache.size > 100) {
    const oldestKey = dnsCache.keys().next().value;
    if (oldestKey !== undefined) dnsCache.delete(oldestKey);
  }
  dnsCache.set(cacheKey, { timestamp: Date.now(), result });
  return result;
}
