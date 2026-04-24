import { Response } from 'express';

export class ResponseUtil {
  static success(res: Response, data: unknown = null, message = 'Thành công', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static error(res: Response, message = 'Có lỗi xảy ra', statusCode = 500, errors: unknown = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }

  static created(res: Response, data: unknown = null, message = 'Tạo thành công') {
    return this.success(res, data, message, 201);
  }

  static noContent(res: Response) {
    return res.status(204).send();
  }
}
