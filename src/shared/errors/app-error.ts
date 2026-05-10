export type AppErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'TENANT_NOT_FOUND'
  | 'TENANT_MISMATCH'
  | 'RATE_LIMITED'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'WEBHOOK_DELIVERY_ERROR'
  | 'INTERNAL_ERROR';

const DEFAULT_STATUS_CODES: Record<AppErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  TENANT_NOT_FOUND: 404,
  TENANT_MISMATCH: 403,
  RATE_LIMITED: 429,
  EXTERNAL_SERVICE_ERROR: 502,
  WEBHOOK_DELIVERY_ERROR: 502,
  INTERNAL_ERROR: 500,
};

const DEFAULT_PUBLIC_MESSAGES: Record<AppErrorCode, string> = {
  BAD_REQUEST: 'Bad request.',
  UNAUTHORIZED: 'Authentication required.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'Not found.',
  CONFLICT: 'Conflict.',
  VALIDATION_ERROR: 'Validation failed.',
  TENANT_NOT_FOUND: 'Restaurant not found.',
  TENANT_MISMATCH: 'Tenant mismatch.',
  RATE_LIMITED: 'Too many requests. Please try again later.',
  EXTERNAL_SERVICE_ERROR: 'An external service is temporarily unavailable.',
  WEBHOOK_DELIVERY_ERROR: 'Webhook delivery failed.',
  INTERNAL_ERROR: 'Something went wrong.',
};

export function getDefaultStatusCode(code: AppErrorCode): number {
  return DEFAULT_STATUS_CODES[code];
}

export function getDefaultPublicMessage(code: AppErrorCode): string {
  return DEFAULT_PUBLIC_MESSAGES[code];
}

export type AppErrorOptions = {
  code: AppErrorCode;
  message: string;
  statusCode?: number;
  publicMessage?: string;
  cause?: unknown;
  details?: Record<string, unknown>;
};

export class AppError extends Error {
  code: AppErrorCode;
  statusCode: number;
  publicMessage: string;
  details?: Record<string, unknown>;

  constructor(options: AppErrorOptions) {
    super(options.message);
    this.name = 'AppError';
    this.code = options.code;
    this.statusCode = options.statusCode ?? getDefaultStatusCode(options.code);
    this.publicMessage =
      options.publicMessage ?? getDefaultPublicMessage(options.code);
    this.details = options.details;
    if (options.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

type SubclassOptions = {
  publicMessage?: string;
  details?: Record<string, unknown>;
  cause?: unknown;
};

export class BadRequestError extends AppError {
  constructor(message: string, options?: SubclassOptions) {
    super({ code: 'BAD_REQUEST', message, ...options });
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', options?: SubclassOptions) {
    super({ code: 'UNAUTHORIZED', message, ...options });
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', options?: SubclassOptions) {
    super({ code: 'FORBIDDEN', message, ...options });
    this.name = 'ForbiddenError';
  }
}

// Backward-compatible signature: `new NotFoundError(entity?, id?)`.
// Existing repos and services use this shape — see Chunk #4.
export class NotFoundError extends AppError {
  entity?: string;
  id?: string;

  constructor(entity?: string, id?: string) {
    const message = entity
      ? `${entity}${id ? ` ${id}` : ''} not found`
      : 'Not found';
    super({ code: 'NOT_FOUND', message });
    this.name = 'NotFoundError';
    this.entity = entity;
    this.id = id;
  }
}

export class ConflictError extends AppError {
  constructor(message: string, options?: SubclassOptions) {
    super({ code: 'CONFLICT', message, ...options });
    this.name = 'ConflictError';
  }
}

// Backward-compatible signature: `new UniqueConstraintError(field)`.
export class UniqueConstraintError extends AppError {
  field: string;

  constructor(field: string) {
    super({
      code: 'CONFLICT',
      message: `Unique constraint violated on ${field}`,
    });
    this.name = 'UniqueConstraintError';
    this.field = field;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, options?: SubclassOptions) {
    super({ code: 'VALIDATION_ERROR', message, ...options });
    this.name = 'ValidationError';
  }
}

// Backward-compatible signature: `new TenantNotFoundError()`.
export class TenantNotFoundError extends AppError {
  constructor() {
    super({ code: 'TENANT_NOT_FOUND', message: 'Tenant not found' });
    this.name = 'TenantNotFoundError';
  }
}

export class TenantMismatchError extends AppError {
  constructor(message: string = 'Tenant mismatch', options?: SubclassOptions) {
    super({ code: 'TENANT_MISMATCH', message, ...options });
    this.name = 'TenantMismatchError';
  }
}

export class ExternalServiceError extends AppError {
  serviceName: string;

  constructor(
    serviceName: string,
    message: string = `${serviceName} is temporarily unavailable`,
    options?: SubclassOptions,
  ) {
    super({ code: 'EXTERNAL_SERVICE_ERROR', message, ...options });
    this.name = 'ExternalServiceError';
    this.serviceName = serviceName;
  }
}

export class WebhookDeliveryError extends AppError {
  constructor(message: string, options?: SubclassOptions) {
    super({ code: 'WEBHOOK_DELIVERY_ERROR', message, ...options });
    this.name = 'WebhookDeliveryError';
  }
}
