/**
 * Adds updatedAt = now() to update payload.
 * Per ADR #16: explicit repository-layer timestamp, not Postgres trigger.
 *
 * Type signature forbids passing updatedAt — repository owns this field.
 */
export function withTimestamps<T extends Record<string, unknown>>(
  data: Omit<T, 'updatedAt'>,
): Omit<T, 'updatedAt'> & { updatedAt: Date } {
  return { ...data, updatedAt: new Date() } as Omit<T, 'updatedAt'> & {
    updatedAt: Date;
  };
}
