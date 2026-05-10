import {
  AppError,
  type AppErrorCode,
  getDefaultStatusCode,
} from './app-error';

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function toAppError(error: unknown): AppError {
  if (isAppError(error)) return error;
  if (error instanceof Error) {
    return new AppError({
      code: 'INTERNAL_ERROR',
      message: error.message,
      cause: error,
    });
  }
  return new AppError({
    code: 'INTERNAL_ERROR',
    message: typeof error === 'string' ? error : 'Unknown error',
    cause: error,
  });
}

export { getDefaultStatusCode };

export function getSafeErrorMessage(error: unknown): string {
  if (isAppError(error)) return error.publicMessage;
  return 'Something went wrong.';
}

type PublicErrorPayload = {
  error: {
    code: AppErrorCode;
    message: string;
  };
};

export function serializePublicError(error: unknown): PublicErrorPayload {
  const appErr = toAppError(error);
  return {
    error: {
      code: appErr.code,
      message: appErr.publicMessage,
    },
  };
}

type InternalErrorPayload = {
  code: AppErrorCode;
  message: string;
  statusCode: number;
  publicMessage: string;
  details?: Record<string, unknown>;
  stack?: string;
};

export function serializeInternalError(error: unknown): InternalErrorPayload {
  const appErr = toAppError(error);
  const payload: InternalErrorPayload = {
    code: appErr.code,
    message: appErr.message,
    statusCode: appErr.statusCode,
    publicMessage: appErr.publicMessage,
  };
  if (appErr.details) payload.details = appErr.details;
  if (appErr.stack) payload.stack = appErr.stack;
  return payload;
}
