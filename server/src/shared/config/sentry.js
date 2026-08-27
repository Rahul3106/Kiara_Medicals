import * as Sentry from '@sentry/node';
import { ENV } from './env.js';
import { logger } from './logger.js';

export const initBackendSentry = (app) => {
  const dsn = process.env.SENTRY_DSN;

  if (dsn) {
    Sentry.init({
      dsn,
      environment: ENV.NODE_ENV,
      release: 'kiara-medicals@1.0.0',
      tracesSampleRate: ENV.IS_PRODUCTION ? 0.2 : 1.0,
      integrations: [
        // Automatically instruments Node.js libraries and Express
      ],
    });

    logger.info({ dsn: dsn.slice(0, 15) + '...' }, 'Initialized Sentry Backend Error Monitoring');
  } else {
    logger.debug('Sentry DSN not provided; error monitoring will log to Pino only.');
  }
};

/**
 * Enriches and captures an error with pharmacy multi-branch context
 * @param {Error} error
 * @param {import('express').Request} req
 */
export const captureSentryError = (error, req = null) => {
  if (!process.env.SENTRY_DSN) return;

  Sentry.withScope((scope) => {
    if (req) {
      if (req.user) {
        scope.setUser({
          id: req.user.id,
          email: req.user.email,
          role: req.user.role,
        });
      }

      if (req.branchId || req.user?.branchId) {
        scope.setTag('branchId', req.branchId || req.user.branchId);
      }

      scope.setExtra('route', req.originalUrl || req.url);
      scope.setExtra('method', req.method);
      scope.setExtra('ip', req.headers['x-forwarded-for'] || req.socket?.remoteAddress);
    }

    Sentry.captureException(error);
  });
};
