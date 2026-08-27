import pino from 'pino';
import pinoHttp from 'pino-http';
import { ENV } from './env.js';

// Sensitive keys to automatically redact from JSON logs
const redactKeys = [
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  'body.password',
  'body.passwordHash',
  'body.refreshToken',
];

const isProd = ENV.NODE_ENV === 'production';

export const logger = pino({
  level: isProd ? 'info' : 'debug',
  redact: {
    paths: redactKeys,
    censor: '[REDACTED]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
  transport: !isProd
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

/**
 * Pino HTTP middleware replacing morgan for structured request/response logging
 */
export const httpLogger = pinoHttp({
  logger,
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customProps: (req) => ({
    branchId: req.branchId || req.user?.branchId || null,
    userId: req.user?.id || null,
    role: req.user?.role || null,
  }),
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});
