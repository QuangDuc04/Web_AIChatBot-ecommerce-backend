import { ShipmentRepository } from '../repositories/shipment.repository';
import { ShippingUpdateRepository } from '../repositories/shippingUpdate.repository';
import { OrderRepository } from '../repositories/order.repository';
import { OrderStatusHistoryRepository } from '../repositories/orderStatusHistory.repository';
import { InventoryService } from './inventory.service';
import { CreateShipmentDto, UpdateShipmentDto, AddShippingUpdateDto, ShipmentFilterDto } from '../dtos/shipment.dto';
import { AppError } from '../errors';
import { OrderStatus, ShipmentStatus } from '../types/enums';

export class ShipmentService {
  private shipmentRepo = new ShipmentRepository();
  private updateRepo = new ShippingUpdateRepository();
  private orderRepo = new OrderRepository();
  private historyRepo = new OrderStatusHistoryRepository();
  private inventoryService = new InventoryService();

  // Customer
  async trackShipment(customerId: string, orderId: string) {
    const order = await this.orderRepo.findByIdOrFail(orderId);
    if (order.customerId !== customerId) throw new AppError('Không có quyền xem đơn hàng này', 403);

    const shipment = await this.shipmentRepo.findByOrderId(orderId);
    if (!shipment) throw new AppError('Đơn hàng chưa được vận chuyển', 404);

    const updates = await this.updateRepo.findByShipmentId(shipment.id);
    return { shipment, updates };
  }

  // Admin
  async getAllShipments(filters: ShipmentFilterDto) {
    return this.shipmentRepo.findAll(filters);
  }

  async getShipment(id: string) {
    return this.shipmentRepo.findByIdOrFail(id);
  }

  async createShipment(dto: CreateShipmentDto, adminId: string) {
    const order = await this.orderRepo.findByIdOrFail(dto.orderId);

    if (![OrderStatus.CONFIRMED, OrderStatus.PROCESSING].includes(order.status)) {
      throw new AppError('Đơn hàng chưa sẵn sàng để vận chuyển', 400);
    }

    const existing = await this.shipmentRepo.findByOrderId(dto.orderId);
    if (existing) throw new AppError('Đơn hàng đã có vận đơn', 400);

    const shipment = await this.shipmentRepo.create({
      orderId: dto.orderId,
      carrier: dto.carrier,
      trackingNumber: dto.trackingNumber,
      status: ShipmentStatus.PREPARING,
      estimatedDeliveryAt: new Date(dto.estimatedDeliveryAt),
    });

    await this.orderRepo.update(dto.orderId, {
      status: OrderStatus.SHIPPING,
      shippedAt: new Date(),
    });

    await this.historyRepo.create({
      orderId: dto.orderId,
      status: OrderStatus.SHIPPING,
      note: `Đã tạo vận đơn. Mã vận đơn: ${dto.trackingNumber}. Đơn vị: ${dto.carrier}`,
      changedByUserId: adminId,
    });

    await this.updateRepo.create({
      shipmentId: shipment.id,
      status: ShipmentStatus.PREPARING,
      location: 'Kho hàng',
      note: 'Đang chuẩn bị hàng',
    });

    return this.shipmentRepo.findByIdOrFail(shipment.id);
  }

  async updateShipment(id: string, dto: UpdateShipmentDto, adminId: string) {
    const shipment = await this.shipmentRepo.findByIdOrFail(id);
    const updateData: any = { ...dto };

    if (dto.status) {
      await this.updateRepo.create({
        shipmentId: id,
        status: dto.status,
        location: '',
        note: dto.failedReason || `Cập nhật trạng thái: ${dto.status}`,
      });

      if (dto.status === ShipmentStatus.DELIVERED) {
        updateData.deliveredAt = new Date();
        await this.completeDelivery(shipment.orderId, adminId);
      }

      if (dto.status === ShipmentStatus.FAILED) {
        await this.historyRepo.create({
          orderId: shipment.orderId,
          status: OrderStatus.SHIPPING,
          note: `Giao hàng thất bại: ${dto.failedReason || 'Không rõ lý do'}`,
          changedByUserId: adminId,
        });
      }
    }

    return this.shipmentRepo.update(id, updateData);
  }

  async addShippingUpdate(dto: AddShippingUpdateDto, adminId: string) {
    await this.shipmentRepo.findByIdOrFail(dto.shipmentId);

    const update = await this.updateRepo.create({
      shipmentId: dto.shipmentId,
      status: dto.status,
      location: dto.location,
      note: dto.note,
    });

    // Update shipment status
    await this.shipmentRepo.update(dto.shipmentId, { status: dto.status as ShipmentStatus });

    if (dto.status === ShipmentStatus.DELIVERED) {
      const shipment = await this.shipmentRepo.findByIdOrFail(dto.shipmentId);
      await this.shipmentRepo.update(dto.shipmentId, { deliveredAt: new Date() });
      await this.completeDelivery(shipment.orderId, adminId);
    }

    return update;
  }

  async markAsDelivered(id: string, adminId: string, deliveryImages?: string[]) {
    const shipment = await this.shipmentRepo.findByIdOrFail(id);

    await this.shipmentRepo.update(id, {
      status: ShipmentStatus.DELIVERED,
      deliveredAt: new Date(),
      deliveryImages,
    });

    await this.updateRepo.create({
      shipmentId: id,
      status: ShipmentStatus.DELIVERED,
      location: 'Đã giao',
      note: 'Giao hàng thành công',
    });

    await this.completeDelivery(shipment.orderId, adminId);
    return this.shipmentRepo.findByIdOrFail(id);
  }

  async markAsFailed(id: string, adminId: string, failedReason: string) {
    const shipment = await this.shipmentRepo.findByIdOrFail(id);

    await this.shipmentRepo.update(id, {
      status: ShipmentStatus.FAILED,
      failedReason,
    });

    await this.updateRepo.create({
      shipmentId: id,
      status: ShipmentStatus.FAILED,
      location: '',
      note: `Giao hàng thất bại: ${failedReason}`,
    });

    await this.historyRepo.create({
      orderId: shipment.orderId,
      status: OrderStatus.SHIPPING,
      note: `Giao thất bại: ${failedReason}`,
      changedByUserId: adminId,
    });

    return this.shipmentRepo.findByIdOrFail(id);
  }

  async getStats() {
    return this.shipmentRepo.getStats();
  }

  private async completeDelivery(orderId: string, adminId: string) {
    const order = await this.orderRepo.findByIdOrFail(orderId);

    await this.orderRepo.update(orderId, {
      status: OrderStatus.DELIVERED,
      deliveredAt: new Date(),
    });

    await this.historyRepo.create({
      orderId,
      status: OrderStatus.DELIVERED,
      note: 'Đã giao hàng thành công',
      changedByUserId: adminId,
    });

    // Confirm inventory sale
    if (order.items) {
      for (const item of order.items) {
        await this.inventoryService.confirmSale(
          item.productId, item.variantId || null, item.quantity, order.orderNumber,
        );
      }
    }
  }
}
