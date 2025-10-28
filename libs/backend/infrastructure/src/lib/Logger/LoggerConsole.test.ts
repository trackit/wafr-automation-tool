/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from 'vitest';

import { LoggerConsole } from './LoggerConsole';

describe('LoggerConsole', () => {
  it('should log with console.debug', () => {
    const { logger } = setup();

    const spy = vi.spyOn(console, 'debug').mockImplementation(() => undefined);

    logger.debug('debug-message', { foo: 'bar' });

    expect(spy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(spy.mock.calls[0][0] as string);
    expect(payload).toEqual({
      message: 'debug-message',
      context: { foo: 'bar' },
    });
  });

  it('should log with console.info', () => {
    const { logger } = setup();

    const spy = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    logger.info('info-message', { a: 1 });

    expect(spy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(spy.mock.calls[0][0] as string);
    expect(payload).toEqual({
      message: 'info-message',
      context: { a: 1 },
    });
  });

  it('should log with console.warn', () => {
    const { logger } = setup();

    const spy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    logger.warn('warn-message', { b: true });

    expect(spy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(spy.mock.calls[0][0] as string);
    expect(payload).toEqual({
      message: 'warn-message',
      context: { b: true },
    });
  });

  it('should log with console.error', () => {
    const { logger } = setup();

    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const err = new Error('boom');

    logger.error('error-message', err);

    expect(spy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(spy.mock.calls[0][0] as string);
    expect(payload.message).toBe('error-message');
    expect(payload.context.message).toBe('boom');
    expect(typeof payload.context.stack).toBe('string');
  });

  it('should log with console.log', () => {
    const { logger } = setup();

    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    logger.log('log-message', { ok: false });

    expect(spy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(spy.mock.calls[0][0] as string);
    expect(payload).toEqual({
      message: 'log-message',
      context: { ok: false },
    });
  });

  it('should transform nested errors and arrays to plain JSON', () => {
    const { logger } = setup();

    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const data = {
      nested: [
        new Error('first'),
        { inner: new Error('second') },
        ['x', new Error('third')],
      ],
    };

    logger.error('nested-error-message', data);

    const payload = JSON.parse(spy.mock.calls[0][0] as string);
    expect(payload.message).toBe('nested-error-message');
    expect(payload.context.nested[0].message).toBe('first');
    expect(payload.context.nested[1].inner.message).toBe('second');
    expect(Array.isArray(payload.context.nested[2])).toBe(true);
    expect(payload.context.nested[2][1].message).toBe('third');
  });

  it('should omit context when data is undefined', () => {
    const { logger } = setup();

    const spy = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    logger.info('no-context-message', undefined);

    const payload = JSON.parse(spy.mock.calls[0][0] as string);
    expect(payload).toEqual({ message: 'no-context-message' });
    expect(payload.context).toBeUndefined();
  });

  it('should not throw when data contains a circular structure', () => {
    const { logger } = setup();

    const circular: any = { a: 1 };
    circular.self = circular; // create cycle

    logger.info('circular-data', circular);
  });

  it('should not throw when serializing an Error with a circular cause', () => {
    const { logger } = setup();

    const outer = new Error('outer');
    const inner = new Error('inner');
    (outer as any).cause = inner; // cycle via Error.cause
    (inner as any).cause = outer; // cycle via Error.cause

    logger.error('circular-error', outer);
  });
});

const setup = () => ({
  logger: new LoggerConsole(),
});
