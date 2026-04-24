import { Request, Response, NextFunction } from 'express';
import { CustomerRepository } from '../../repositories/customer.repository';
import { AppDataSource } from '../../config/database';
import { CustomerImage } from '../../entities/CustomerImage';
import { CloudinaryService } from '../../services/cloudinary.service';
import { ResponseUtil } from '../../utils/response.util';
import { NotFoundError } from '../../errors';

const customerRepo = new CustomerRepository();

export class AdminCustomerController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, search, sortBy = 'createdAt', order = 'DESC' } = req.query as any;
      const result = await customerRepo.findAll(
        Number(page), Number(limit), search, sortBy, order,
      );
      ResponseUtil.success(res, result);
    } catch (e) { next(e); }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const [totalCustomers, newThisMonth, topSpenders] = await Promise.all([
        customerRepo.countAll(),
        customerRepo.countSince(monthStart),
        customerRepo.getTopSpenders(10),
      ]);

      ResponseUtil.success(res, { totalCustomers, newThisMonth, topSpenders });
    } catch (e) { next(e); }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customerRepo.findByIdWithOrders(req.params.id);
      ResponseUtil.success(res, customer);
    } catch (e) { next(e); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, phone, address, company, notes, isActive } = req.body;

      const customer = await customerRepo.create({
        name,
        email: email || undefined,
        phone: phone || undefined,
        address: address || undefined,
        company: company || undefined,
        notes: notes || undefined,
        isActive: isActive === 'true' || isActive === true,
      });

      // Upload images
      const files = req.files as Express.Multer.File[] | undefined;
      if (files?.length) {
        const imageRepo = AppDataSource.getRepository(CustomerImage);
        const uploaded = await CloudinaryService.uploadMultipleImages(files, 'customers');
        const images = uploaded.map((img, i) => imageRepo.create({
          customerId: customer.id,
          url: img.url,
          publicId: img.publicId,
          sortOrder: i,
        }));
        await imageRepo.save(images);
      }

      const result = await customerRepo.findByIdWithImages(customer.id);
      ResponseUtil.success(res, result, 'Tạo khách hàng thành công', 201);
    } catch (e) { next(e); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, phone, address, company, notes, isActive } = req.body;

      const updateData: Record<string, any> = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email || null;
      if (phone !== undefined) updateData.phone = phone || null;
      if (address !== undefined) updateData.address = address || null;
      if (company !== undefined) updateData.company = company || null;
      if (notes !== undefined) updateData.notes = notes || null;
      if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;

      await customerRepo.update(req.params.id, updateData);

      // Upload new images
      const files = req.files as Express.Multer.File[] | undefined;
      if (files?.length) {
        const imageRepo = AppDataSource.getRepository(CustomerImage);
        const uploaded = await CloudinaryService.uploadMultipleImages(files, 'customers');
        const images = uploaded.map((img, i) => imageRepo.create({
          customerId: req.params.id,
          url: img.url,
          publicId: img.publicId,
          sortOrder: i,
        }));
        await imageRepo.save(images);
      }

      const result = await customerRepo.findByIdWithImages(req.params.id);
      ResponseUtil.success(res, result, 'Cập nhật thành công');
    } catch (e) { next(e); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      // Delete images from Cloudinary
      const imageRepo = AppDataSource.getRepository(CustomerImage);
      const images = await imageRepo.find({ where: { customerId: req.params.id } });
      const publicIds = images.map(i => i.publicId).filter(Boolean);
      if (publicIds.length) {
        await CloudinaryService.deleteMultipleImages(publicIds);
      }

      await customerRepo.delete(req.params.id);
      ResponseUtil.success(res, null, 'Đã xóa khách hàng');
    } catch (e) { next(e); }
  }

  async uploadImages(req: Request, res: Response, next: NextFunction) {
    try {
      const customerId = req.params.id;
      await customerRepo.findByIdOrFail(customerId);

      const files = req.files as Express.Multer.File[] | undefined;
      if (!files?.length) {
        return ResponseUtil.error(res, 'Không có file nào được upload', 400);
      }

      const imageRepo = AppDataSource.getRepository(CustomerImage);
      const uploaded = await CloudinaryService.uploadMultipleImages(files, 'customers');
      const images = uploaded.map((img, i) => imageRepo.create({
        customerId,
        url: img.url,
        publicId: img.publicId,
        sortOrder: i,
      }));
      await imageRepo.save(images);

      ResponseUtil.success(res, images, 'Upload thành công');
    } catch (e) { next(e); }
  }

  async deleteImage(req: Request, res: Response, next: NextFunction) {
    try {
      const imageRepo = AppDataSource.getRepository(CustomerImage);
      const image = await imageRepo.findOne({ where: { id: req.params.imageId, customerId: req.params.id } });
      if (!image) throw new NotFoundError('Không tìm thấy ảnh');

      if (image.publicId) {
        await CloudinaryService.deleteImage(image.publicId);
      }
      await imageRepo.remove(image);

      ResponseUtil.success(res, null, 'Đã xóa ảnh');
    } catch (e) { next(e); }
  }

  async updateNotes(req: Request, res: Response, next: NextFunction) {
    try {
      const { notes, tags } = req.body;
      const customer = await customerRepo.update(req.params.id, { notes, tags });
      ResponseUtil.success(res, customer, 'Cập nhật thành công');
    } catch (e) { next(e); }
  }
}
