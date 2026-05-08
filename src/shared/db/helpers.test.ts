import { describe, it, expect } from 'vitest';
import { withTimestamps } from './helpers';

describe('withTimestamps', () => {
  it('adds updatedAt to data', () => {
    const before = Date.now();
    const result = withTimestamps({ name: 'test' });
    const after = Date.now();
    expect(result.name).toBe('test');
    expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.updatedAt.getTime()).toBeLessThanOrEqual(after);
  });
});
