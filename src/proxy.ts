import { NextResponse, type NextRequest } from 'next/server';
import { parseSubdomain } from '@/shared/tenant/parse-subdomain';
import { TENANT_HEADER } from '@/shared/tenant/constants';

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};

export function proxy(request: NextRequest) {
  const host = request.headers.get('host');
  const result = parseSubdomain(host);

  if (result.kind === 'apex') return NextResponse.next();
  if (result.kind === 'reserved') return NextResponse.next();

  if (result.kind === 'local') {
    const devSlug = process.env.DEV_TENANT_SLUG;
    if (!devSlug) return NextResponse.next();
    return passWithTenant(request, devSlug);
  }

  if (result.kind === 'invalid') return NextResponse.next();

  return passWithTenant(request, result.slug);
}

function passWithTenant(request: NextRequest, slug: string) {
  const headers = new Headers(request.headers);
  headers.set(TENANT_HEADER, slug);
  return NextResponse.next({ request: { headers } });
}
