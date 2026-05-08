import { describe, it, expect } from 'vitest';
import { parseSubdomain } from './parse-subdomain';

describe('parseSubdomain', () => {
  it('local: localhost', () => {
    expect(parseSubdomain('localhost:3000')).toEqual({ kind: 'local' });
  });

  it('local: 127.0.0.1', () => {
    expect(parseSubdomain('127.0.0.1:3000')).toEqual({ kind: 'local' });
  });

  it('local-with-subdomain: j6.localhost', () => {
    expect(parseSubdomain('j6.localhost:3000')).toEqual({
      kind: 'tenant',
      slug: 'j6',
    });
  });

  it('apex: locando.net', () => {
    expect(parseSubdomain('locando.net')).toEqual({ kind: 'apex' });
  });

  it('tenant: j6.locando.net', () => {
    expect(parseSubdomain('j6.locando.net')).toEqual({
      kind: 'tenant',
      slug: 'j6',
    });
  });

  it('reserved: www', () => {
    expect(parseSubdomain('www.locando.net')).toEqual({
      kind: 'reserved',
      subdomain: 'www',
    });
  });

  it('reserved: app', () => {
    expect(parseSubdomain('app.locando.net')).toEqual({
      kind: 'reserved',
      subdomain: 'app',
    });
  });

  it('invalid: empty host', () => {
    expect(parseSubdomain(null).kind).toBe('invalid');
  });

  it('invalid: malformed slug with underscore', () => {
    expect(parseSubdomain('Bad_Slug.locando.net').kind).toBe('invalid');
  });
});
