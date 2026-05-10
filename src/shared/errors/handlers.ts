import { type AppErrorCode } from './app-error';
import { logError } from './logger';
import { serializePublicError, toAppError } from './utils';

type ServerActionErrorResult = {
  ok: false;
  error: {
    code: AppErrorCode;
    message: string;
  };
};

export function handleServerActionError(
  error: unknown,
): ServerActionErrorResult {
  const appErr = toAppError(error);
  logError(appErr);
  return {
    ok: false,
    error: {
      code: appErr.code,
      message: appErr.publicMessage,
    },
  };
}

export function handleRouteError(error: unknown): Response {
  const appErr = toAppError(error);
  logError(appErr);
  return new Response(JSON.stringify(serializePublicError(appErr)), {
    status: appErr.statusCode,
    headers: { 'content-type': 'application/json' },
  });
}
