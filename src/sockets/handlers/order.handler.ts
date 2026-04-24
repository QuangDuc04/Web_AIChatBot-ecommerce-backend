import { Socket } from 'socket.io';
import { UserRole } from '../../types/enums';

export function handleOrders(socket: Socket) {
  const user = socket.data.user;
  if (!user) return;

  socket.on('order:subscribe', () => {
    if (user.role === UserRole.ADMIN || user.role === UserRole.STAFF) {
      socket.join('orders');
      socket.emit('order:subscribed');
    }
  });

  socket.on('order:unsubscribe', () => {
    socket.leave('orders');
  });
}
