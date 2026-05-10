import { describe, it, expect } from 'vitest';
import {
  canRetry,
  getNextAttemptAt,
  WEBHOOK_MAX_ATTEMPTS,
} from './retry';

describe('getNextAttemptAt', () => {
  function expectSecondsFromNow(date: Date | null, seconds: number) {
    expect(date).not.toBeNull();
    if (!date) return;
    const diff = (date.getTime() - Date.now()) / 1000;
    // Allow ±5 seconds slack for test-runner timing.
    expect(diff).toBeGreaterThanOrEqual(seconds - 5);
    expect(diff).toBeLessThanOrEqual(seconds + 5);
  }

  it('returns ~60s for attempt 1', () => {
    expectSecondsFromNow(getNextAttemptAt(1), 60);
  });

  it('returns ~300s for attempt 2', () => {
    expectSecondsFromNow(getNextAttemptAt(2), 300);
  });

  it('returns ~900s for attempt 3', () => {
    expectSecondsFromNow(getNextAttemptAt(3), 900);
  });

  it('returns ~3600s for attempt 4', () => {
    expectSecondsFromNow(getNextAttemptAt(4), 3600);
  });

  it('returns null for attempt 5 (final)', () => {
    expect(getNextAttemptAt(5)).toBeNull();
  });

  it('returns null for any attempt beyond max', () => {
    expect(getNextAttemptAt(6)).toBeNull();
    expect(getNextAttemptAt(99)).toBeNull();
  });
});

describe('canRetry', () => {
  it('allows retry when attempts < max', () => {
    expect(canRetry(0)).toBe(true);
    expect(canRetry(WEBHOOK_MAX_ATTEMPTS - 1)).toBe(true);
  });

  it('blocks retry when attempts >= max', () => {
    expect(canRetry(WEBHOOK_MAX_ATTEMPTS)).toBe(false);
    expect(canRetry(WEBHOOK_MAX_ATTEMPTS + 1)).toBe(false);
  });

  it('respects custom max', () => {
    expect(canRetry(2, 3)).toBe(true);
    expect(canRetry(3, 3)).toBe(false);
  });
});
