import { serializeInternalError } from './utils';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogContext = {
  tenantId?: string;
  requestId?: string;
  module?: string;
  action?: string;
  [key: string]: unknown;
};

export function logError(error: unknown, context?: LogContext): void {
  const serialized = serializeInternalError(error);
  console.error(JSON.stringify({ level: 'error', ...serialized, context }));
}

export function logInfo(message: string, context?: LogContext): void {
  console.info(JSON.stringify({ level: 'info', message, context }));
}
