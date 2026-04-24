import { AppError } from './AppError';

export interface FieldError {
  field: string;
  message: string;
}

export class ValidationError extends AppError {
  public readonly errors: FieldError[];

  constructor(errors: FieldError[]) {
    super('Dữ liệu không hợp lệ', 400);
    this.errors = errors;
  }
}
