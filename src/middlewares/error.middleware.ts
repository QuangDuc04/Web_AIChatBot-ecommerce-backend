import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { ValidationError } from '../errors/ValidationError';

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error(`[Error] ${error.message}`, error.stack);

  if (error instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      message: error.message,
      errors: error.errors,
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  // Default 500
  const message =
    process.env.NODE_ENV === 'development'
      ? error.message
      : 'Có lỗi xảy ra, vui lòng thử lại sau';

  return res.status(500).json({
    success: false,
    message,
  });
}
