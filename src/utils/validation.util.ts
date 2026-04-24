import { validate } from 'class-validator';
import { plainToInstance, ClassConstructor } from 'class-transformer';
import { ValidationError, FieldError } from '../errors';

export class ValidationUtil {
  static async validateDto<T extends object>(
    dtoClass: ClassConstructor<T>,
    body: unknown,
  ): Promise<T> {
    const dto = plainToInstance(dtoClass, body);
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      const fieldErrors: FieldError[] = errors.map((err) => ({
        field: err.property,
        message: Object.values(err.constraints || {}).join(', '),
      }));
      throw new ValidationError(fieldErrors);
    }

    return dto;
  }
}
