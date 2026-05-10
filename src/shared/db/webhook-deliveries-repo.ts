import 'server-only';
import { and, asc, eq, lte, sql } from 'drizzle-orm';
import { db } from './client';
import { webhookDeliveries } from './schema';
import { NotFoundError } from './errors';

export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type WebhookDeliveryInsert = typeof webhookDeliveries.$inferInsert;
export type WebhookDeliveryUpdate = Partial<
  Omit<WebhookDelivery, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
>;

const DEFAULT_PENDING_LIMIT = 25;

export const webhookDeliveriesRepo = {
  async create(
    tenantId: string,
    data: Omit<WebhookDeliveryInsert, 'tenantId'>,
  ): Promise<WebhookDelivery> {
    const [row] = await db
      .insert(webhookDeliveries)
      .values({ ...data, tenantId })
      .returning();
    return row;
  },

  async findById(
    tenantId: string,
    id: string,
  ): Promise<WebhookDelivery | null> {
    const [row] = await db
      .select()
      .from(webhookDeliveries)
      .where(
        and(
          eq(webhookDeliveries.tenantId, tenantId),
          eq(webhookDeliveries.id, id),
        ),
      )
      .limit(1);
    return row ?? null;
  },

  // Intentionally cross-tenant: this is the scheduler view used by
  // deliverPendingWebhooks(). Tenant-scoped admin-facing variants will
  // come later when the dashboard needs them.
  async findPendingDue(
    limit: number = DEFAULT_PENDING_LIMIT,
  ): Promise<WebhookDelivery[]> {
    return db
      .select()
      .from(webhookDeliveries)
      .where(
        and(
          eq(webhookDeliveries.status, 'pending'),
          lte(webhookDeliveries.nextAttemptAt, new Date()),
          sql`${webhookDeliveries.attempts} < ${webhookDeliveries.maxAttempts}`,
        ),
      )
      .orderBy(asc(webhookDeliveries.createdAt))
      .limit(limit);
  },

  async markDelivered(
    tenantId: string,
    id: string,
    responseStatus?: number,
  ): Promise<WebhookDelivery> {
    const now = new Date();
    const [row] = await db
      .update(webhookDeliveries)
      .set({
        status: 'delivered',
        deliveredAt: now,
        lastAttemptAt: now,
        lastError: null,
        responseStatus: responseStatus ?? null,
        updatedAt: now,
      })
      .where(
        and(
          eq(webhookDeliveries.tenantId, tenantId),
          eq(webhookDeliveries.id, id),
        ),
      )
      .returning();
    if (!row) throw new NotFoundError('webhook_delivery', id);
    return row;
  },

  async markFailed(
    tenantId: string,
    id: string,
    args: {
      error: string;
      responseStatus?: number;
      nextAttemptAt: Date | null;
    },
  ): Promise<WebhookDelivery> {
    const now = new Date();
    const isFinal = args.nextAttemptAt === null;
    const baseSet = {
      attempts: sql`${webhookDeliveries.attempts} + 1`,
      lastAttemptAt: now,
      lastError: args.error,
      responseStatus: args.responseStatus ?? null,
      status: (isFinal ? 'failed' : 'pending') as
        | 'failed'
        | 'pending',
      updatedAt: now,
    };
    // On final failure (nextAttemptAt === null) we leave the existing
    // nextAttemptAt column unchanged; status='failed' removes the row
    // from scheduler queries anyway, so the stored value no longer
    // affects retry behavior.
    const [row] = await db
      .update(webhookDeliveries)
      .set(
        args.nextAttemptAt !== null
          ? { ...baseSet, nextAttemptAt: args.nextAttemptAt }
          : baseSet,
      )
      .where(
        and(
          eq(webhookDeliveries.tenantId, tenantId),
          eq(webhookDeliveries.id, id),
        ),
      )
      .returning();
    if (!row) throw new NotFoundError('webhook_delivery', id);
    return row;
  },
};
