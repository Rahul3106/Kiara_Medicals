import { AppError } from '../errors/AppError.js';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof AppError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Something went wrong';
    error = new AppError(message, statusCode, 'INTERNAL_SERVER_ERROR', error.stack);
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
