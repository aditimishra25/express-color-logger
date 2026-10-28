import type { Writable } from 'node:stream';
import morgan, { type FormatFn } from 'morgan';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { RequestHandler } from 'express';

type MorganFormat = FormatFn<IncomingMessage, ServerResponse<IncomingMessage>>;

export type HttpLoggerOptions = {
  /** Disable ANSI colors, or enable them explicitly. */
  colorize?: boolean;
  /** Response time above which requests are considered slow. Default: 500 ms. */
  slowThresholdMs?: number;
  /** Response time above which requests are considered very slow. Default: 1000 ms. */
  verySlowThresholdMs?: number;
  stream?: Pick<Writable, 'write'>;
};

type Color = 'green' | 'yellow' | 'blue' | 'purple' | 'red' | 'gray' | 'cyan';

const ANSI: Record<Color, string> = {
  green: '\u001B[32m',
  yellow: '\u001B[33m',
  blue: '\u001B[34m',
  purple: '\u001B[35m',
  red: '\u001B[31m',
  gray: '\u001B[90m',
  cyan: '\u001B[36m',
};

const RESET = '\u001B[0m';

function supportsColor(): boolean {
  return Boolean(process.stdout.isTTY) && !('NO_COLOR' in process.env);
}

function paint(value: string, color: Color, enabled: boolean, bold = false): string {
  if (!enabled) return value;
  const prefix = bold ? '\u001B[1m' : '';
  return `${prefix}${ANSI[color]}${value}${RESET}`;
}

function methodColor(method: string): Color {
  switch (method.toUpperCase()) {
    case 'GET': return 'green';
    case 'POST': return 'yellow';
    case 'PUT': return 'blue';
    case 'PATCH': return 'purple';
    case 'DELETE': return 'red';
    default: return 'gray';
  }
}

function statusColor(status: number): Color {
  if (status >= 200 && status < 300) return 'green';
  if (status >= 300 && status < 400) return 'blue';
  if (status >= 400 && status < 500) return 'yellow';
  if (status >= 500 && status < 600) return 'red';
  return 'gray';
}

function durationColor(ms: number, slow: number, verySlow: number): Color {
  if (ms > verySlow) return 'red';
  if (ms >= slow) return 'yellow';
  return 'cyan';
}

/**
 * Create a compact, colorized Morgan middleware for Express.
 *
 * Query strings are excluded by default to avoid leaking tokens or other
 * sensitive values embedded in URLs. Request bodies are never logged.
 */
export function colorLogger(options: HttpLoggerOptions = {}): RequestHandler {
  const enabled = options.colorize ?? supportsColor();
  const slow = options.slowThresholdMs ?? 500;
  const verySlow = options.verySlowThresholdMs ?? 1000;

  if (!Number.isFinite(slow) || slow < 0) {
    throw new RangeError('slowThresholdMs must be a non-negative number');
  }

  if (!Number.isFinite(verySlow) || verySlow < slow) {
    throw new RangeError(
      'verySlowThresholdMs must be a number greater than or equal to slowThresholdMs',
    );
  }

  const format: MorganFormat = (tokens, req, res) => {
    const method = tokens.method(req, res) ?? 'UNKNOWN';
    const rawUrl = tokens.url(req, res) ?? '/';
    const url = rawUrl.split('?')[0] || '/';
    const status = Number(tokens.status(req, res) ?? 0);
    const responseTime = Number(tokens['response-time'](req, res) ?? 0);
    const contentLength = tokens.res(req, res, 'content-length') ?? '-';
    const duration = Number.isFinite(responseTime) ? responseTime : 0;
    const safeStatus = Number.isFinite(status) ? status : 0;

    return [
      paint(method.padEnd(7), methodColor(method), enabled, true),
      paint(url, 'purple', enabled),
      paint(String(safeStatus), statusColor(safeStatus), enabled, true),
      paint(`${contentLength} B`, 'gray', enabled),
      paint(`${duration.toFixed(1)} ms`, durationColor(duration, slow, verySlow), enabled),
    ].join(' ');
  };

  return morgan(format, {
      stream: options.stream ?? process.stdout,
  });
}
