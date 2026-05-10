import { describe, it, expect } from 'vitest';
import { createWebhookSignature } from './signature';

describe('createWebhookSignature', () => {
  const secret = 'test-secret-do-not-use';
  const payload = '{"hello":"world"}';
  const timestamp = '2026-05-10T00:00:00.000Z';

  it('returns sha256= prefixed hex string', () => {
    const sig = createWebhookSignature({ secret, payload, timestamp });
    expect(sig.startsWith('sha256=')).toBe(true);
    expect(sig.length).toBeGreaterThan('sha256='.length);
  });

  it('is deterministic for identical secret + payload + timestamp', () => {
    const a = createWebhookSignature({ secret, payload, timestamp });
    const b = createWebhookSignature({ secret, payload, timestamp });
    expect(a).toBe(b);
  });

  it('changes when secret changes', () => {
    const a = createWebhookSignature({ secret, payload, timestamp });
    const b = createWebhookSignature({
      secret: 'different-secret',
      payload,
      timestamp,
    });
    expect(a).not.toBe(b);
  });

  it('changes when payload changes', () => {
    const a = createWebhookSignature({ secret, payload, timestamp });
    const b = createWebhookSignature({
      secret,
      payload: '{"hello":"different"}',
      timestamp,
    });
    expect(a).not.toBe(b);
  });

  it('changes when timestamp changes', () => {
    const a = createWebhookSignature({ secret, payload, timestamp });
    const b = createWebhookSignature({
      secret,
      payload,
      timestamp: '2026-05-11T00:00:00.000Z',
    });
    expect(a).not.toBe(b);
  });
});
