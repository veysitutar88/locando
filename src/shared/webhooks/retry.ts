export const WEBHOOK_MAX_ATTEMPTS = 5;

const BACKOFF_SECONDS: Record<number, number> = {
  1: 60,
  2: 300,
  3: 900,
  4: 3600,
};

export function getNextAttemptAt(
  attemptsAfterThisFailure: number,
): Date | null {
  const seconds = BACKOFF_SECONDS[attemptsAfterThisFailure];
  if (seconds === undefined) return null;
  return new Date(Date.now() + seconds * 1000);
}

export function canRetry(
  attempts: number,
  maxAttempts: number = WEBHOOK_MAX_ATTEMPTS,
): boolean {
  return attempts < maxAttempts;
}
