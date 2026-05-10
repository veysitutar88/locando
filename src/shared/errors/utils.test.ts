import { describe, it, expect } from 'vitest';
import {
  AppError,
  BadRequestError,
  NotFoundError,
} from './app-error';
import {
  getSafeErrorMessage,
  isAppError,
  serializeInternalError,
  serializePublicError,
  toAppError,
} from './utils';

describe('isAppError', () => {
  it('returns true for AppError instances', () => {
    expect(isAppError(new BadRequestError('x'))).toBe(true);
    expect(isAppError(new NotFoundError('reservation', 'id'))).toBe(true);
  });

  it('returns false for plain Error', () => {
    expect(isAppError(new Error('plain'))).toBe(false);
  });

  it('returns false for non-Error values', () => {
    expect(isAppError('string')).toBe(false);
    expect(isAppError(null)).toBe(false);
    expect(isAppError(undefined)).toBe(false);
    expect(isAppError({})).toBe(false);
  });
});

describe('toAppError', () => {
  it('returns AppError unchanged', () => {
    const original = new BadRequestError('bad');
    expect(toAppError(original)).toBe(original);
  });

  it('wraps native Error as INTERNAL_ERROR preserving cause', () => {
    const native = new Error('oops');
    const wrapped = toAppError(native);
    expect(wrapped).toBeInstanceOf(AppError);
    expect(wrapped.code).toBe('INTERNAL_ERROR');
    expect(wrapped.message).toBe('oops');
    expect(wrapped.cause).toBe(native);
  });

  it('wraps string as INTERNAL_ERROR with string message', () => {
    const wrapped = toAppError('bare string');
    expect(wrapped.code).toBe('INTERNAL_ERROR');
    expect(wrapped.message).toBe('bare string');
    expect(wrapped.cause).toBe('bare string');
  });

  it('wraps unknown values', () => {
    const wrapped = toAppError({ weird: true });
    expect(wrapped.code).toBe('INTERNAL_ERROR');
    expect(wrapped.message).toBe('Unknown error');
  });
});

describe('getSafeErrorMessage', () => {
  it('returns publicMessage for AppError', () => {
    const err = new BadRequestError('internal detail', {
      publicMessage: 'public detail',
    });
    expect(getSafeErrorMessage(err)).toBe('public detail');
  });

  it('returns generic message for non-AppError', () => {
    expect(getSafeErrorMessage(new Error('leak'))).toBe(
      'Something went wrong.',
    );
    expect(getSafeErrorMessage('raw')).toBe('Something went wrong.');
  });
});

describe('serializePublicError', () => {
  it('returns code + publicMessage shape', () => {
    const err = new NotFoundError('reservation', 'abc');
    const out = serializePublicError(err);
    expect(out).toEqual({
      error: { code: 'NOT_FOUND', message: 'Not found.' },
    });
  });

  it('hides internal message, stack, details, cause', () => {
    const err = new BadRequestError('SECRET_INTERNAL_DETAIL', {
      details: { sensitive: 'PII' },
      cause: new Error('SECRET_CAUSE'),
      publicMessage: 'Bad request.',
    });
    const out = serializePublicError(err);
    const json = JSON.stringify(out);
    expect(json).not.toContain('SECRET_INTERNAL_DETAIL');
    expect(json).not.toContain('SECRET_CAUSE');
    expect(json).not.toContain('PII');
    expect(json).not.toContain('stack');
  });

  it('wraps unknown errors into INTERNAL_ERROR shape', () => {
    const out = serializePublicError(new Error('unknown'));
    expect(out.error.code).toBe('INTERNAL_ERROR');
    expect(out.error.message).toBe('Something went wrong.');
  });
});

describe('serializeInternalError', () => {
  it('includes code, message, statusCode, publicMessage', () => {
    const err = new BadRequestError('internal detail');
    const out = serializeInternalError(err);
    expect(out.code).toBe('BAD_REQUEST');
    expect(out.message).toBe('internal detail');
    expect(out.statusCode).toBe(400);
    expect(out.publicMessage).toBe('Bad request.');
  });

  it('includes details when present', () => {
    const err = new BadRequestError('x', { details: { a: 1 } });
    const out = serializeInternalError(err);
    expect(out.details).toEqual({ a: 1 });
  });

  it('includes stack when present', () => {
    const err = new BadRequestError('x');
    const out = serializeInternalError(err);
    expect(typeof out.stack).toBe('string');
    expect(out.stack?.length).toBeGreaterThan(0);
  });
});
