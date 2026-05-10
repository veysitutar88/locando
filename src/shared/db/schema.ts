import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  text,
  pgEnum,
  index,
  uniqueIndex,
  date,
  time,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';

export const reservationStatusEnum = pgEnum('reservation_status', [
  'pending',
  'confirmed',
  'seated',
  'no_show',
  'cancelled',
]);

export const staffRoleEnum = pgEnum('staff_role', ['owner', 'waiter']);

export const webhookDeliveryStatusEnum = pgEnum('webhook_delivery_status', [
  'pending',
  'delivered',
  'failed',
]);

export const restaurants = pgTable(
  'restaurants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: varchar('slug', { length: 63 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    ownerEmail: varchar('owner_email', { length: 255 }).notNull(),
    timezone: varchar('timezone', { length: 63 })
      .default('Europe/Berlin')
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex('restaurants_slug_unique').on(table.slug)],
);

export const tables = pgTable(
  'tables',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => restaurants.id, { onDelete: 'cascade' }),
    number: varchar('number', { length: 10 }).notNull(),
    capacity: integer('capacity').notNull(),
    zone: varchar('zone', { length: 63 }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('tables_tenant_number_unique').on(table.tenantId, table.number),
    index('tables_tenant_idx').on(table.tenantId),
  ],
);

export const reservations = pgTable(
  'reservations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => restaurants.id, { onDelete: 'cascade' }),
    tableId: uuid('table_id').references(() => tables.id, {
      onDelete: 'set null',
    }),
    guestName: varchar('guest_name', { length: 255 }).notNull(),
    guestEmail: varchar('guest_email', { length: 255 }).notNull(),
    guestPhone: varchar('guest_phone', { length: 63 }),
    partySize: integer('party_size').notNull(),
    reservationDate: date('reservation_date').notNull(),
    reservationTime: time('reservation_time').notNull(),
    durationMinutes: integer('duration_minutes').default(90).notNull(),
    status: reservationStatusEnum('status').default('pending').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    seatedAt: timestamp('seated_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  },
  (table) => [
    index('reservations_tenant_date_idx').on(
      table.tenantId,
      table.reservationDate,
    ),
    index('reservations_tenant_status_idx').on(table.tenantId, table.status),
    index('reservations_tenant_email_idx').on(
      table.tenantId,
      table.guestEmail,
    ),
  ],
);

export const staffUsers = pgTable(
  'staff_users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => restaurants.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull(),
    googleUserId: varchar('google_user_id', { length: 255 }),
    role: staffRoleEnum('role').notNull(),
    name: varchar('name', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('staff_users_tenant_email_unique').on(
      table.tenantId,
      table.email,
    ),
    uniqueIndex('staff_users_google_user_id_unique')
      .on(table.googleUserId)
      .where(sql`${table.googleUserId} IS NOT NULL`),
  ],
);

export const otpCodes = pgTable(
  'otp_codes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    reservationId: uuid('reservation_id')
      .notNull()
      .references(() => reservations.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 6 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    attempts: integer('attempts').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('otp_codes_reservation_idx').on(table.reservationId),
    index('otp_codes_code_expires_idx').on(table.code, table.expiresAt),
  ],
);

export const webhookConfigs = pgTable(
  'webhook_configs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => restaurants.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    signingSecret: text('signing_secret').notNull(),
    enabled: boolean('enabled').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('webhook_configs_tenant_url_unique').on(table.tenantId, table.url),
    index('webhook_configs_tenant_idx').on(table.tenantId),
    index('webhook_configs_enabled_idx').on(table.enabled),
  ],
);

export const webhookDeliveries = pgTable(
  'webhook_deliveries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => restaurants.id, { onDelete: 'cascade' }),
    webhookConfigId: uuid('webhook_config_id').references(
      () => webhookConfigs.id,
      { onDelete: 'set null' },
    ),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    payload: jsonb('payload').notNull(),
    status: webhookDeliveryStatusEnum('status').default('pending').notNull(),
    attempts: integer('attempts').default(0).notNull(),
    maxAttempts: integer('max_attempts').default(5).notNull(),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),
    lastError: text('last_error'),
    responseStatus: integer('response_status'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('webhook_deliveries_tenant_idx').on(table.tenantId),
    index('webhook_deliveries_status_next_attempt_idx').on(
      table.status,
      table.nextAttemptAt,
    ),
    index('webhook_deliveries_event_type_idx').on(table.eventType),
    index('webhook_deliveries_config_idx').on(table.webhookConfigId),
  ],
);

export const restaurantsRelations = relations(restaurants, ({ many }) => ({
  tables: many(tables),
  reservations: many(reservations),
  staffUsers: many(staffUsers),
  webhookConfigs: many(webhookConfigs),
  webhookDeliveries: many(webhookDeliveries),
}));

export const tablesRelations = relations(tables, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [tables.tenantId],
    references: [restaurants.id],
  }),
  reservations: many(reservations),
}));

export const reservationsRelations = relations(
  reservations,
  ({ one, many }) => ({
    restaurant: one(restaurants, {
      fields: [reservations.tenantId],
      references: [restaurants.id],
    }),
    table: one(tables, {
      fields: [reservations.tableId],
      references: [tables.id],
    }),
    otpCodes: many(otpCodes),
  }),
);

export const staffUsersRelations = relations(staffUsers, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [staffUsers.tenantId],
    references: [restaurants.id],
  }),
}));

export const otpCodesRelations = relations(otpCodes, ({ one }) => ({
  reservation: one(reservations, {
    fields: [otpCodes.reservationId],
    references: [reservations.id],
  }),
}));

export const webhookConfigsRelations = relations(
  webhookConfigs,
  ({ one, many }) => ({
    restaurant: one(restaurants, {
      fields: [webhookConfigs.tenantId],
      references: [restaurants.id],
    }),
    deliveries: many(webhookDeliveries),
  }),
);

export const webhookDeliveriesRelations = relations(
  webhookDeliveries,
  ({ one }) => ({
    restaurant: one(restaurants, {
      fields: [webhookDeliveries.tenantId],
      references: [restaurants.id],
    }),
    webhookConfig: one(webhookConfigs, {
      fields: [webhookDeliveries.webhookConfigId],
      references: [webhookConfigs.id],
    }),
  }),
);
