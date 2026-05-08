import 'server-only';
import { and, eq } from 'drizzle-orm';
import { db } from '@/shared/db/client';
import { reservations } from '@/shared/db/schema';
import { NotFoundError } from '@/shared/db/errors';
import { withTimestamps } from '@/shared/db/helpers';

export type Reservation = typeof reservations.$inferSelect;
export type ReservationInsert = Omit<
  typeof reservations.$inferInsert,
  'tenantId'
>;
export type ReservationUpdate = Partial<
  Omit<Reservation, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
>;

export const reservationsRepo = {
  async findMany(tenantId: string): Promise<Reservation[]> {
    return db
      .select()
      .from(reservations)
      .where(eq(reservations.tenantId, tenantId));
  },

  async findById(tenantId: string, id: string): Promise<Reservation | null> {
    const [row] = await db
      .select()
      .from(reservations)
      .where(
        and(eq(reservations.tenantId, tenantId), eq(reservations.id, id)),
      )
      .limit(1);
    return row ?? null;
  },

  async findByIdOrThrow(tenantId: string, id: string): Promise<Reservation> {
    const row = await this.findById(tenantId, id);
    if (!row) throw new NotFoundError('reservation', id);
    return row;
  },

  async create(
    tenantId: string,
    data: ReservationInsert,
  ): Promise<Reservation> {
    const [row] = await db
      .insert(reservations)
      .values({ ...data, tenantId })
      .returning();
    return row;
  },

  async update(
    tenantId: string,
    id: string,
    data: ReservationUpdate,
  ): Promise<Reservation> {
    const [row] = await db
      .update(reservations)
      .set(withTimestamps(data))
      .where(
        and(eq(reservations.tenantId, tenantId), eq(reservations.id, id)),
      )
      .returning();
    if (!row) throw new NotFoundError('reservation', id);
    return row;
  },

  async delete(tenantId: string, id: string): Promise<void> {
    const deleted = await db
      .delete(reservations)
      .where(
        and(eq(reservations.tenantId, tenantId), eq(reservations.id, id)),
      )
      .returning({ id: reservations.id });
    if (deleted.length === 0) throw new NotFoundError('reservation', id);
  },
};
