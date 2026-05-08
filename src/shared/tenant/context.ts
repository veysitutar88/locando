import 'server-only';
import { headers } from 'next/headers';
import {
  restaurantsRepo,
  type Restaurant,
} from '@/shared/db/restaurants-repo';
import { TENANT_HEADER } from './constants';

export type Tenant = Restaurant;

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
  return restaurantsRepo.findBySlug(slug);
}

export async function requireTenant(): Promise<Tenant> {
  const tenant = await getTenant();
  if (!tenant) throw new TenantNotFoundError();
  return tenant;
}
