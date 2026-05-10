export const WEBHOOK_EVENT_TYPES = [
  'reservation.created',
  'reservation.confirmed',
  'reservation.cancelled',
  'reservation.no_show',
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

export type WebhookPayload = {
  tenantId: string;
  eventType: WebhookEventType;
  occurredAt: string;
  data: Record<string, unknown>;
};

export function isWebhookEventType(value: string): value is WebhookEventType {
  return (WEBHOOK_EVENT_TYPES as readonly string[]).includes(value);
}
