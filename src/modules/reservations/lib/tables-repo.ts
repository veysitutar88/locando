import 'server-only';
import { and, eq } from 'drizzle-orm';
import { db } from '@/shared/db/client';
import { tables } from '@/shared/db/schema';
import { NotFoundError } from '@/shared/db/errors';
import { withTimestamps } from '@/shared/db/helpers';

export type RestaurantTable = typeof tables.$inferSelect;
export type RestaurantTableInsert = Omit<
  typeof tables.$inferInsert,
  'tenantId'
>;
export type RestaurantTableUpdate = Partial<
  Omit<RestaurantTable, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
>;

export const tablesRepo = {
  async findMany(tenantId: string): Promise<RestaurantTable[]> {
    return db.select().from(tables).where(eq(tables.tenantId, tenantId));
  },

  async findById(
    tenantId: string,
    id: string,
  ): Promise<RestaurantTable | null> {
    const [row] = await db
      .select()
      .from(tables)
      .where(and(eq(tables.tenantId, tenantId), eq(tables.id, id)))
      .limit(1);
    return row ?? null;
  },

  async findByIdOrThrow(
    tenantId: string,
    id: string,
  ): Promise<RestaurantTable> {
    const row = await this.findById(tenantId, id);
    if (!row) throw new NotFoundError('table', id);
    return row;
  },

  async create(
    tenantId: string,
    data: RestaurantTableInsert,
  ): Promise<RestaurantTable> {
    const [row] = await db
      .insert(tables)
      .values({ ...data, tenantId })
      .returning();
    return row;
  },

  async update(
    tenantId: string,
    id: string,
    data: RestaurantTableUpdate,
  ): Promise<RestaurantTable> {
    const [row] = await db
      .update(tables)
      .set(withTimestamps(data))
      .where(and(eq(tables.tenantId, tenantId), eq(tables.id, id)))
      .returning();
    if (!row) throw new NotFoundError('table', id);
    return row;
  },

  async delete(tenantId: string, id: string): Promise<void> {
    const deleted = await db
      .delete(tables)
      .where(and(eq(tables.tenantId, tenantId), eq(tables.id, id)))
      .returning({ id: tables.id });
    if (deleted.length === 0) throw new NotFoundError('table', id);
  },
};
