import { Server } from 'socket.io';

export class OrderEvents {
  static emitNewOrder(io: Server, order: unknown) {
    io.to('orders').emit('order:new', { order });
  }

  static emitOrderUpdated(io: Server, order: unknown, userId: string) {
    io.to(`user:${userId}`).emit('order:updated', { order });
    io.to('orders').emit('order:updated', { order });
  }

  static emitStatusChanged(io: Server, orderId: string, status: string, note: string | undefined, userId: string) {
    io.to(`user:${userId}`).emit('order:status_changed', { orderId, status, note });
  }

  static emitLowStock(io: Server, product: unknown) {
    io.to('orders').emit('product:stock_low', { product });
  }
}
