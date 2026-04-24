import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { ResponseUtil } from '../utils/response.util';

const userService = new UserService();

export class UserController {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await userService.getProfile(req.customer!.id);
      ResponseUtil.success(res, profile);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await userService.updateProfile(req.customer!.id, req.body);
      ResponseUtil.success(res, profile, 'Cập nhật thông tin thành công');
    } catch (error) {
      next(error);
    }
  }

  async getAddresses(req: Request, res: Response, next: NextFunction) {
    try {
      const addresses = await userService.getAddresses(req.customer!.id);
      ResponseUtil.success(res, addresses);
    } catch (error) {
      next(error);
    }
  }

  async getAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const address = await userService.getAddress(req.params.id, req.customer!.id);
      ResponseUtil.success(res, address);
    } catch (error) {
      next(error);
    }
  }

  async createAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const address = await userService.createAddress(req.customer!.id, req.body);
      ResponseUtil.created(res, address, 'Thêm địa chỉ thành công');
    } catch (error) {
      next(error);
    }
  }

  async updateAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const address = await userService.updateAddress(req.params.id, req.customer!.id, req.body);
      ResponseUtil.success(res, address, 'Cập nhật địa chỉ thành công');
    } catch (error) {
      next(error);
    }
  }

  async deleteAddress(req: Request, res: Response, next: NextFunction) {
    try {
      await userService.deleteAddress(req.params.id, req.customer!.id);
      ResponseUtil.success(res, null, 'Xóa địa chỉ thành công');
    } catch (error) {
      next(error);
    }
  }

  async setDefaultAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const address = await userService.setDefaultAddress(req.params.id, req.customer!.id);
      ResponseUtil.success(res, address, 'Đặt địa chỉ mặc định thành công');
    } catch (error) {
      next(error);
    }
  }
}
