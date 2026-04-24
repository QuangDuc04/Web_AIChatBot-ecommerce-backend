import { AppError } from './AppError';

export class UnauthorizedError extends AppError {
  constructor(message = 'Không có quyền truy cập') {
    super(message, 401);
  }
}
