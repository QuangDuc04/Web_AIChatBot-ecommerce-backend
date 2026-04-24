import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { SocketConfig } from '../config/socket';
import { socketAuthMiddleware } from './middleware/auth.middleware';
import { handleConnection, handleDisconnect } from './handlers/connection.handler';
import { handleNotifications } from './handlers/notification.handler';
import { handleChat } from './handlers/chat.handler';
import { handleOrders } from './handlers/order.handler';
import { handleGuestChat } from './handlers/guestChat.handler';

let io: Server;

export function setupSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, SocketConfig);

  // Authentication middleware (supports both JWT and guest connections)
  io.use(socketAuthMiddleware);

  // Connection handler
  io.on('connection', (socket) => {
    if (socket.data.isGuest) {
      // Guest: only join their conversation room
      handleGuestChat(socket, io);
    } else {
      // Authenticated admin/staff: full access
      handleConnection(socket);
      handleNotifications(socket, io);
      handleChat(socket, io);
      handleOrders(socket);
    }

    socket.on('disconnect', () => {
      if (!socket.data.isGuest) {
        handleDisconnect(socket);
      }
    });

    socket.on('error', (err) => {
      console.error(`Socket error [${socket.id}]:`, err.message);
    });
  });

  console.log('Socket.IO server initialized');
  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}
