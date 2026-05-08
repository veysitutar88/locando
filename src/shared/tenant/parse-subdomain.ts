import { LOCAL_HOSTNAMES, RESERVED_SUBDOMAINS } from './constants';

export type ParseResult =
  | { kind: 'tenant'; slug: string }
  | { kind: 'reserved'; subdomain: string }
  | { kind: 'apex' }
  | { kind: 'local' }
  | { kind: 'invalid'; reason: string };

export function parseSubdomain(host: string | null): ParseResult {
  if (!host) return { kind: 'invalid', reason: 'no host header' };

  const hostname = host.split(':')[0].toLowerCase();

  if (LOCAL_HOSTNAMES.has(hostname)) return { kind: 'local' };

  if (hostname.endsWith('.localhost')) {
    const slug = hostname.replace('.localhost', '');
    if (RESERVED_SUBDOMAINS.has(slug)) {
      return { kind: 'reserved', subdomain: slug };
    }
    return validateSlug(slug);
  }

  const parts = hostname.split('.');
  if (parts.length < 2) return { kind: 'invalid', reason: 'malformed host' };
  if (parts.length === 2) return { kind: 'apex' };

  const slug = parts[0];
  if (RESERVED_SUBDOMAINS.has(slug)) {
    return { kind: 'reserved', subdomain: slug };
  }
  return validateSlug(slug);
}

function validateSlug(slug: string): ParseResult {
  if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(slug)) {
    return { kind: 'invalid', reason: 'invalid slug format' };
  }
  return { kind: 'tenant', slug };
}
