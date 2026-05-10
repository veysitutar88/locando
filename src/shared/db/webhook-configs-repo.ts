import 'server-only';
import { and, eq } from 'drizzle-orm';
import { db } from './client';
import { webhookConfigs } from './schema';
import { NotFoundError } from './errors';
import { withTimestamps } from './helpers';

export type WebhookConfig = typeof webhookConfigs.$inferSelect;
export type WebhookConfigInsert = typeof webhookConfigs.$inferInsert;
export type WebhookConfigUpdate = Partial<
  Omit<WebhookConfig, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
>;

export const webhookConfigsRepo = {
  async findEnabledByTenant(tenantId: string): Promise<WebhookConfig[]> {
    return db
      .select()
      .from(webhookConfigs)
      .where(
        and(
          eq(webhookConfigs.tenantId, tenantId),
          eq(webhookConfigs.enabled, true),
        ),
      );
  },

  async findById(
    tenantId: string,
    id: string,
  ): Promise<WebhookConfig | null> {
    const [row] = await db
      .select()
      .from(webhookConfigs)
      .where(
        and(eq(webhookConfigs.tenantId, tenantId), eq(webhookConfigs.id, id)),
      )
      .limit(1);
    return row ?? null;
  },

  async create(
    tenantId: string,
    data: Omit<WebhookConfigInsert, 'tenantId'>,
  ): Promise<WebhookConfig> {
    const [row] = await db
      .insert(webhookConfigs)
      .values({ ...data, tenantId })
      .returning();
    return row;
  },

  async update(
    tenantId: string,
    id: string,
    data: WebhookConfigUpdate,
  ): Promise<WebhookConfig> {
    const [row] = await db
      .update(webhookConfigs)
      .set(withTimestamps(data))
      .where(
        and(eq(webhookConfigs.tenantId, tenantId), eq(webhookConfigs.id, id)),
      )
      .returning();
    if (!row) throw new NotFoundError('webhook_config', id);
    return row;
  },

  async delete(tenantId: string, id: string): Promise<void> {
    const deleted = await db
      .delete(webhookConfigs)
      .where(
        and(eq(webhookConfigs.tenantId, tenantId), eq(webhookConfigs.id, id)),
      )
      .returning({ id: webhookConfigs.id });
    if (deleted.length === 0) throw new NotFoundError('webhook_config', id);
  },
};
