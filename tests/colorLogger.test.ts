
import { afterEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { colorLogger } from '../src/index';

describe('colorLogger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns an Express middleware function', () => {
    const middleware = colorLogger();

    expect(typeof middleware).toBe('function');
    expect(middleware.length).toBe(3);
  });

  it('accepts color and response-time options', () => {
    expect(() =>
      colorLogger({
        colorize: false,
        slowThresholdMs: 200,
        verySlowThresholdMs: 800,
      }),
    ).not.toThrow();
  });

  it('rejects invalid response-time thresholds', () => {
    expect(() => colorLogger({ slowThresholdMs: -1 })).toThrow(
      'slowThresholdMs must be a non-negative number',
    );

    expect(() =>
      colorLogger({
        slowThresholdMs: 1000,
        verySlowThresholdMs: 500,
      }),
    ).toThrow(
      'verySlowThresholdMs must be a number greater than or equal to slowThresholdMs',
    );
  });

  
it('logs a request without exposing query-string values', async () => {
  const lines: string[] = [];
  const app = express();

  app.use(
    colorLogger({
      colorize: false,
      stream: {
        write: (message) => {
          lines.push(message);
        },
      },
    }),
  );

  app.get('/users', (_req, res) => {
    res.status(200).send('ok');
  });

  await request(app).get('/users?token=secret-value');

  const output = lines.join('');

  expect(output).toContain('/users');
  expect(output).not.toContain('secret-value');
});

});
