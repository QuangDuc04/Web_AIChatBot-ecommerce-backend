import { Request, Response, NextFunction } from 'express';
import { ClassConstructor } from 'class-transformer';
import { ValidationUtil } from '../utils/validation.util';

export function validateBody<T extends object>(dtoClass: ClassConstructor<T>) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = await ValidationUtil.validateDto(dtoClass, req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateQuery<T extends object>(dtoClass: ClassConstructor<T>) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.query = await ValidationUtil.validateDto(dtoClass, req.query) as any;
      next();
    } catch (error) {
      next(error);
    }
  };
}
