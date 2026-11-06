/**
 * Security header audit. Produces a 0–100 score, a letter grade and one row per
 * check with a plain-English explanation and, when it fails, a concrete fix.
 */

const SIX_MONTHS_SECONDS = 15552000;
const SESSIONISH_COOKIE_RE = /(sess|sid|auth|token|jwt|login|remember)/i;

function check(name, explanation, status, value, points, fix = null) {
  return { name, explanation, status, value, points, fix: status === 'pass' ? null : fix };
}

function auditHsts(hsts, isHttps) {
  const explanation = 'Tells browsers to always use HTTPS for this site, blocking downgrade attacks.';
  const fix = 'Send Strict-Transport-Security: max-age=31536000; includeSubDomains';
  if (!isHttps) return check('HTTPS enforcement (HSTS)', explanation, 'fail', 'Not applicable over HTTP', 0, 'Serve the site over HTTPS first.');
  if (!hsts) return check('HTTPS enforcement (HSTS)', explanation, 'warn', 'Not configured', 0, fix);
  const maxAge = Number((/max-age=(\d+)/i.exec(hsts) || [])[1] || 0);
  if (maxAge < SIX_MONTHS_SECONDS) {
    return check('HTTPS enforcement (HSTS)', explanation, 'warn', `max-age=${maxAge} (under 6 months)`, 10, fix);
  }
  return check('HTTPS enforcement (HSTS)', explanation, 'pass', hsts.slice(0, 80), 20);
}

function auditCsp(csp) {
  const name = 'Content Security Policy';
  const explanation = 'Limits which sources may run scripts or load content, the main defence against XSS.';
  if (!csp.present) {
    return check(name, explanation, 'fail', 'Missing', 0, "Start with Content-Security-Policy: default-src 'self' and add the origins you need.");
  }
  const scriptSrc = csp.directives['script-src'] || csp.directives['default-src'] || [];
  const usesNonceOrHash = scriptSrc.some((v) => /^'(nonce-|sha256-|sha384-|sha512-|strict-dynamic)/.test(v));
  const strict = (!csp.hasUnsafeInline || usesNonceOrHash) && !csp.hasUnsafeEval;
  const rules = Object.keys(csp.directives).length;
  if (strict) return check(name, explanation, 'pass', `${rules} directives${usesNonceOrHash ? ', nonce/hash based' : ''}`, 25);
  return check(
    name,
    explanation,
    'warn',
    csp.hasUnsafeEval ? "Allows 'unsafe-eval'" : "Allows 'unsafe-inline' scripts",
    15,
    "Replace 'unsafe-inline' / 'unsafe-eval' with nonces or hashes."
  );
}

function auditCookies(cookies, isHttps) {
  const name = 'Cookie flags';
  const explanation = 'Session cookies should be HttpOnly (hidden from scripts) and Secure (HTTPS only).';
  if (cookies.length === 0) return check(name, explanation, 'info', 'No cookies set', 0);
  const weak = cookies.filter(
    (c) => SESSIONISH_COOKIE_RE.test(c.name) && (!c.httpOnly || (isHttps && !c.secure))
  );
  if (weak.length === 0) return check(name, explanation, 'pass', `${cookies.length} cookies checked`, 0);
  return check(
    name,
    explanation,
    'warn',
    `${weak.length} session-like cookie${weak.length > 1 ? 's' : ''} missing flags`,
    0,
    `Set HttpOnly; Secure; SameSite=Lax on: ${weak.slice(0, 4).map((c) => c.name).join(', ')}`
  );
}

export function gradeFromScore(score) {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}

export function analyzeSecurityPosture({ protocol, headers, cookies, cspAnalysis }) {
  const isHttps = protocol === 'https:';
  const xcto = headers['x-content-type-options'] || '';
  const xfo = headers['x-frame-options'];
  const frameAncestors = cspAnalysis.directives['frame-ancestors'];
  const refPol = headers['referrer-policy'];
  const permPol = headers['permissions-policy'];
  const coop = headers['cross-origin-opener-policy'];
  const corp = headers['cross-origin-resource-policy'];

  const checks = [
    check(
      'Encrypted connection (HTTPS)',
      'Encrypts traffic between the browser and the server.',
      isHttps ? 'pass' : 'fail',
      isHttps ? 'HTTPS' : 'Plain HTTP',
      isHttps ? 15 : 0,
      'Serve every page over HTTPS and redirect HTTP to it.'
    ),
    auditHsts(headers['strict-transport-security'], isHttps),
    auditCsp(cspAnalysis),
    check(
      'MIME-sniffing protection',
      'Stops the browser from treating uploaded files as executable scripts.',
      /nosniff/i.test(xcto) ? 'pass' : 'warn',
      /nosniff/i.test(xcto) ? 'nosniff' : 'Not set',
      /nosniff/i.test(xcto) ? 10 : 0,
      'Send X-Content-Type-Options: nosniff'
    ),
    check(
      'Clickjacking protection',
      'Prevents other sites from embedding this page in a hidden frame.',
      xfo || frameAncestors ? 'pass' : 'warn',
      xfo ? `X-Frame-Options: ${xfo}` : frameAncestors ? 'CSP frame-ancestors' : 'Embedding allowed',
      xfo || frameAncestors ? 10 : 0,
      "Send Content-Security-Policy: frame-ancestors 'self'"
    ),
    check(
      'Referrer policy',
      'Controls how much of the URL is shared with sites you link to.',
      refPol ? 'pass' : 'info',
      refPol || 'Browser default',
      refPol ? 10 : 0,
      'Send Referrer-Policy: strict-origin-when-cross-origin'
    ),
    check(
      'Permissions policy',
      'Restricts access to camera, microphone, location and similar APIs.',
      permPol ? 'pass' : 'info',
      permPol ? 'Restricted' : 'Not specified',
      permPol ? 5 : 0,
      'Send Permissions-Policy: camera=(), microphone=(), geolocation=()'
    ),
    check(
      'Cross-origin isolation',
      'Keeps this tab isolated from cross-origin popups and side-channel attacks.',
      coop || corp ? 'pass' : 'info',
      [coop ? `COOP: ${coop}` : null, corp ? `CORP: ${corp}` : null].filter(Boolean).join(' · ') || 'Not configured',
      coop || corp ? 5 : 0,
      'Send Cross-Origin-Opener-Policy: same-origin'
    ),
    auditCookies(cookies, isHttps)
  ];

  const score = Math.min(100, checks.reduce((sum, c) => sum + c.points, 0));

  const cookieSummary = {
    total: cookies.length,
    httpOnlyCount: cookies.filter((c) => c.httpOnly).length,
    secureCount: cookies.filter((c) => c.secure).length,
    sessionCount: cookies.filter((c) => c.session).length,
    items: cookies.slice(0, 40).map((c) => ({
      name: c.name,
      domain: c.domain,
      httpOnly: Boolean(c.httpOnly),
      secure: Boolean(c.secure),
      sameSite: c.sameSite || 'unspecified',
      session: Boolean(c.session)
    }))
  };

  return {
    score,
    grade: gradeFromScore(score),
    checks: checks.map(({ points, ...rest }) => rest),
    cookieSummary,
    rawHeaders: headers
  };
}
