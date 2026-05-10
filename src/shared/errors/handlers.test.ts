import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotFoundError, BadRequestError } from './app-error';
import { handleRouteError, handleServerActionError } from './handlers';

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleErrorSpy = vi
    .spyOn(console, 'error')
    .mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

describe('handleServerActionError', () => {
  it('returns ok:false with public code + message for AppError', () => {
    const result = handleServerActionError(
      new NotFoundError('reservation', 'id-1'),
    );
    expect(result).toEqual({
      ok: false,
      error: { code: 'NOT_FOUND', message: 'Not found.' },
    });
  });

  it('wraps plain Error as INTERNAL_ERROR and hides message', () => {
    const result = handleServerActionError(new Error('SECRET'));
    expect(result.ok).toBe(false);
    expect(result.error.code).toBe('INTERNAL_ERROR');
    expect(result.error.message).toBe('Something went wrong.');
    expect(JSON.stringify(result)).not.toContain('SECRET');
  });

  it('logs the error via console.error', () => {
    handleServerActionError(new BadRequestError('x'));
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });
});

describe('handleRouteError', () => {
  it('returns Response with correct status for known AppError', async () => {
    const response = handleRouteError(
      new NotFoundError('reservation', 'id-1'),
    );
    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toBe('application/json');
    const body = (await response.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('Not found.');
  });

  it('returns Response with status 422 for ValidationError-like', async () => {
    const response = handleRouteError(
      new BadRequestError('bad', { publicMessage: 'Bad request.' }),
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: { code: string } };
    expect(body.error.code).toBe('BAD_REQUEST');
  });

  it('returns 500 + generic message for unknown errors and hides internal', async () => {
    const response = handleRouteError(new Error('SECRET_LEAK'));
    expect(response.status).toBe(500);
    const text = await response.text();
    expect(text).not.toContain('SECRET_LEAK');
    expect(text).toContain('Something went wrong.');
  });

  it('logs the error via console.error', () => {
    handleRouteError(new BadRequestError('x'));
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });
});
