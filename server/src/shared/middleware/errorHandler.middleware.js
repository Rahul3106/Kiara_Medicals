import { AppError } from '../errors/AppError.js';
import { logger } from '../config/logger.js';
import { captureSentryError } from '../config/sentry.js';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof AppError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Something went wrong';
    error = new AppError(message, statusCode, 'INTERNAL_SERVER_ERROR', error.stack);
  }

  // Structured log via Pino
  if (error.statusCode >= 500) {
    logger.error(
      {
        err: {
          message: error.message,
          stack: error.stack,
          code: error.errorCode,
        },
        route: req.originalUrl,
        method: req.method,
        userId: req.user?.id,
        branchId: req.branchId || req.user?.branchId,
      },
      'Unhandled Server Exception'
    );

    // Capture in Sentry with context
    captureSentryError(error, req);
  } else {
    logger.warn(
      {
        code: error.errorCode,
        message: error.message,
        statusCode: error.statusCode,
        route: req.originalUrl,
      },
      'Client Operational Error'
    );
  }

  const response = {
    success: false,
    error: {
      code: error.errorCode,
      message: error.message,
      ...(error.details && { details: error.details }),
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
  };

  res.status(error.statusCode).json(response);
};
