export const RESERVED_SUBDOMAINS = new Set([
  'app',
  'www',
  'api',
  'admin',
  'book',
  'root',
  '_next',
  'static',
]);

export const TENANT_HEADER = 'x-tenant-slug';

export const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0']);
