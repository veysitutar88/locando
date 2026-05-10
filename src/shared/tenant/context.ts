import 'server-only';
import { headers } from 'next/headers';
import {
  restaurantsRepo,
  type Restaurant,
} from '@/shared/db/restaurants-repo';
import { TenantNotFoundError } from '@/shared/errors/app-error';
import { TENANT_HEADER } from './constants';

export type Tenant = Restaurant;

// Re-export for compatibility with callers that imported
// TenantNotFoundError from this module before Chunk #8.
export { TenantNotFoundError };

export async function getTenant(): Promise<Tenant | null> {
  const h = await headers();
  const slug = h.get(TENANT_HEADER);
  if (!slug) return null;
  return restaurantsRepo.findBySlug(slug);
}

export async function requireTenant(): Promise<Tenant> {
  const tenant = await getTenant();
  if (!tenant) throw new TenantNotFoundError();
  return tenant;
}
