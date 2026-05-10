import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BadRequestError } from './app-error';
import { logError, logInfo } from './logger';

let errorSpy: ReturnType<typeof vi.spyOn>;
let infoSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
});

afterEach(() => {
  errorSpy.mockRestore();
  infoSpy.mockRestore();
});

describe('logError', () => {
  it('calls console.error with serialized error JSON', () => {
    logError(new BadRequestError('boom'), { module: 'test' });
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const arg = errorSpy.mock.calls[0]?.[0];
    expect(typeof arg).toBe('string');
    const parsed = JSON.parse(arg as string);
    expect(parsed.level).toBe('error');
    expect(parsed.code).toBe('BAD_REQUEST');
    expect(parsed.message).toBe('boom');
    expect(parsed.context).toEqual({ module: 'test' });
  });

  it('handles native Error by wrapping into INTERNAL_ERROR', () => {
    logError(new Error('native boom'));
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const arg = errorSpy.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(arg);
    expect(parsed.code).toBe('INTERNAL_ERROR');
    expect(parsed.message).toBe('native boom');
  });
});

describe('logInfo', () => {
  it('calls console.info with structured payload', () => {
    logInfo('startup ok', { module: 'boot' });
    expect(infoSpy).toHaveBeenCalledTimes(1);
    const arg = infoSpy.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(arg);
    expect(parsed.level).toBe('info');
    expect(parsed.message).toBe('startup ok');
    expect(parsed.context).toEqual({ module: 'boot' });
  });
});
