import { describe, it, expect } from 'vitest';
import {
  AppError,
  BadRequestError,
  ConflictError,
  ExternalServiceError,
  ForbiddenError,
  NotFoundError,
  TenantMismatchError,
  TenantNotFoundError,
  UnauthorizedError,
  UniqueConstraintError,
  ValidationError,
  WebhookDeliveryError,
  getDefaultStatusCode,
} from './app-error';

describe('AppError', () => {
  it('uses default status code for code', () => {
    const err = new AppError({ code: 'BAD_REQUEST', message: 'bad' });
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('BAD_REQUEST');
    expect(err.message).toBe('bad');
  });

  it('allows custom status code override', () => {
    const err = new AppError({
      code: 'BAD_REQUEST',
      message: 'bad',
      statusCode: 418,
    });
    expect(err.statusCode).toBe(418);
  });

  it('falls back to default publicMessage when not provided', () => {
    const err = new AppError({ code: 'NOT_FOUND', message: 'internal' });
    expect(err.publicMessage).toBe('Not found.');
  });

  it('uses custom publicMessage when provided', () => {
    const err = new AppError({
      code: 'NOT_FOUND',
      message: 'internal',
      publicMessage: 'No such restaurant.',
    });
    expect(err.publicMessage).toBe('No such restaurant.');
  });

  it('preserves cause', () => {
    const cause = new Error('underlying');
    const err = new AppError({
      code: 'INTERNAL_ERROR',
      message: 'wrapper',
      cause,
    });
    expect(err.cause).toBe(cause);
  });

  it('is instance of Error', () => {
    const err = new AppError({ code: 'INTERNAL_ERROR', message: 'x' });
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });
});

describe('getDefaultStatusCode', () => {
  it('maps each code to expected HTTP status', () => {
    expect(getDefaultStatusCode('BAD_REQUEST')).toBe(400);
    expect(getDefaultStatusCode('UNAUTHORIZED')).toBe(401);
    expect(getDefaultStatusCode('FORBIDDEN')).toBe(403);
    expect(getDefaultStatusCode('NOT_FOUND')).toBe(404);
    expect(getDefaultStatusCode('CONFLICT')).toBe(409);
    expect(getDefaultStatusCode('VALIDATION_ERROR')).toBe(422);
    expect(getDefaultStatusCode('TENANT_NOT_FOUND')).toBe(404);
    expect(getDefaultStatusCode('TENANT_MISMATCH')).toBe(403);
    expect(getDefaultStatusCode('RATE_LIMITED')).toBe(429);
    expect(getDefaultStatusCode('EXTERNAL_SERVICE_ERROR')).toBe(502);
    expect(getDefaultStatusCode('WEBHOOK_DELIVERY_ERROR')).toBe(502);
    expect(getDefaultStatusCode('INTERNAL_ERROR')).toBe(500);
  });
});

describe('subclass constructors', () => {
  it('BadRequestError defaults to 400', () => {
    const e = new BadRequestError('missing field');
    expect(e.code).toBe('BAD_REQUEST');
    expect(e.statusCode).toBe(400);
    expect(e).toBeInstanceOf(AppError);
  });

  it('UnauthorizedError defaults to 401', () => {
    const e = new UnauthorizedError();
    expect(e.code).toBe('UNAUTHORIZED');
    expect(e.statusCode).toBe(401);
  });

  it('ForbiddenError defaults to 403', () => {
    const e = new ForbiddenError();
    expect(e.code).toBe('FORBIDDEN');
    expect(e.statusCode).toBe(403);
  });

  it('NotFoundError preserves entity/id backward-compatible signature', () => {
    const e = new NotFoundError('reservation', 'abc-123');
    expect(e.code).toBe('NOT_FOUND');
    expect(e.statusCode).toBe(404);
    expect(e.entity).toBe('reservation');
    expect(e.id).toBe('abc-123');
    expect(e.message).toBe('reservation abc-123 not found');
  });

  it('NotFoundError without args returns generic message', () => {
    const e = new NotFoundError();
    expect(e.message).toBe('Not found');
    expect(e.entity).toBeUndefined();
    expect(e.id).toBeUndefined();
  });

  it('ConflictError defaults to 409', () => {
    const e = new ConflictError('duplicate');
    expect(e.statusCode).toBe(409);
  });

  it('UniqueConstraintError carries field and maps to CONFLICT', () => {
    const e = new UniqueConstraintError('slug');
    expect(e.code).toBe('CONFLICT');
    expect(e.statusCode).toBe(409);
    expect(e.field).toBe('slug');
    expect(e.message).toContain('slug');
  });

  it('ValidationError carries details', () => {
    const e = new ValidationError('invalid', {
      details: { field: 'email' },
    });
    expect(e.code).toBe('VALIDATION_ERROR');
    expect(e.statusCode).toBe(422);
    expect(e.details).toEqual({ field: 'email' });
  });

  it('TenantNotFoundError uses TENANT_NOT_FOUND code', () => {
    const e = new TenantNotFoundError();
    expect(e.code).toBe('TENANT_NOT_FOUND');
    expect(e.statusCode).toBe(404);
    expect(e.message).toBe('Tenant not found');
  });

  it('TenantMismatchError uses TENANT_MISMATCH code', () => {
    const e = new TenantMismatchError();
    expect(e.code).toBe('TENANT_MISMATCH');
    expect(e.statusCode).toBe(403);
  });

  it('ExternalServiceError carries serviceName', () => {
    const e = new ExternalServiceError('Resend');
    expect(e.code).toBe('EXTERNAL_SERVICE_ERROR');
    expect(e.statusCode).toBe(502);
    expect(e.serviceName).toBe('Resend');
  });

  it('WebhookDeliveryError uses WEBHOOK_DELIVERY_ERROR code', () => {
    const e = new WebhookDeliveryError('HTTP 500');
    expect(e.code).toBe('WEBHOOK_DELIVERY_ERROR');
    expect(e.statusCode).toBe(502);
  });
});
