import { describe, it, expect } from 'vitest';
import { isWebhookEventType, WEBHOOK_EVENT_TYPES } from './events';

describe('isWebhookEventType', () => {
  it('accepts every known event type', () => {
    for (const t of WEBHOOK_EVENT_TYPES) {
      expect(isWebhookEventType(t)).toBe(true);
    }
  });

  it('rejects unknown event types', () => {
    expect(isWebhookEventType('reservation.unknown')).toBe(false);
    expect(isWebhookEventType('')).toBe(false);
    expect(isWebhookEventType('Reservation.Created')).toBe(false);
  });
});
