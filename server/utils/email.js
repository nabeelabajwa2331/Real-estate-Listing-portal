// Rejects obviously fake addresses so accounts always have a deliverable inbox
// that the owner can verify. Combines a formatting/domain check with a live DNS
// check that the domain can actually receive mail.

import { promises as dns } from 'dns';

const PLACEHOLDER_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'example.edu',
  'test.com',
  'test',
  'localhost',
  'invalid',
  'local',
  'mail.local',
]);

const PLACEHOLDER_TLDS = ['.test', '.invalid', '.localhost', '.example', '.local'];

// A short list of common disposable/temporary mail providers.
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  'guerrillamail.com',
  'sharklasers.com',
  'yopmail.com',
  'trashmail.com',
  'getnada.com',
  'throwawaymail.com',
  'dispostable.com',
  'fakeinbox.com',
  'maildrop.cc',
]);

export const emailDomain = (email = '') => String(email).split('@')[1]?.toLowerCase() || '';

export const isDisallowedEmail = (email) => {
  const domain = emailDomain(email);
  if (!domain) return true;
  if (PLACEHOLDER_DOMAINS.has(domain)) return true;
  if (PLACEHOLDER_TLDS.some((tld) => domain.endsWith(tld))) return true;
  if (DISPOSABLE_DOMAINS.has(domain)) return true;
  return false;
};

const DNS_TIMEOUT_MS = Number(process.env.MX_LOOKUP_TIMEOUT_MS || 4000);

const withTimeout = (promise, ms) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(Object.assign(new Error('DNS lookup timed out'), { code: 'ETIMEOUT' })),
      ms
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });

// Remembers recent lookups so repeated signups on the same domain (gmail.com,
// etc.) don't hit DNS every time.
const cache = new Map();
const CACHE_MS = 10 * 60 * 1000;

async function lookupMailCapable(domain) {
  // A domain that publishes MX records can receive mail.
  try {
    const mx = await withTimeout(dns.resolveMx(domain), DNS_TIMEOUT_MS);
    if (mx.length) return true;
  } catch (err) {
    if (err.code === 'ENOTFOUND') return false; // domain does not exist
    if (err.code !== 'ENODATA') return true; // transient DNS problem -> don't block
  }

  // No MX: fall back to an A record, which acts as an implicit mail host (RFC 5321).
  try {
    const a = await withTimeout(dns.resolve4(domain), DNS_TIMEOUT_MS);
    return a.length > 0;
  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') return false;
    return true; // transient DNS problem -> don't block
  }
}

// True when the domain can plausibly receive mail. Fails open on transient DNS
// errors so a resolver hiccup never blocks legitimate signups; only a definitive
// "no MX and no A record" is treated as invalid.
export const domainCanReceiveMail = async (domain) => {
  if (!domain) return false;

  const cached = cache.get(domain);
  if (cached && cached.expires > Date.now()) return cached.ok;

  let ok = true;
  try {
    ok = await lookupMailCapable(domain);
  } catch {
    ok = true; // fail open
  }

  cache.set(domain, { ok, expires: Date.now() + CACHE_MS });
  return ok;
};
