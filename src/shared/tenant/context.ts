import 'server-only';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { db } from '@/shared/db/client';
import { restaurants } from '@/shared/db/schema';
import { TENANT_HEADER } from './constants';

export type Tenant = typeof restaurants.$inferSelect;

export class TenantNotFoundError extends Error {
  constructor() {
    super('Tenant not found');
    this.name = 'TenantNotFoundError';
  }
}

export async function getTenant(): Promise<Tenant | null> {
  const h = await headers();
  const slug = h.get(TENANT_HEADER);
  if (!slug) return null;
  const tenant = await db.query.restaurants.findFirst({
    where: eq(restaurants.slug, slug),
  });
  return tenant ?? null;
}

export async function requireTenant(): Promise<Tenant> {
  const tenant = await getTenant();
  if (!tenant) throw new TenantNotFoundError();
  return tenant;
}
