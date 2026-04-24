import { Socket } from 'socket.io';
import { JwtUtil } from '../../utils/jwt.util';
import { UserRepository } from '../../repositories/user.repository';

const userRepo = new UserRepository();

export async function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
  try {
    const token = socket.handshake.auth?.token;
    const guestConversationId = socket.handshake.auth?.conversationId;

    // Guest connection — no JWT, just conversationId
    if (!token && guestConversationId) {
      socket.data.isGuest = true;
      socket.data.guestConversationId = guestConversationId;
      return next();
    }

    // Authenticated connection — JWT required
    if (!token) return next(new Error('Token không được cung cấp'));

    const payload = JwtUtil.verifyAccessToken(token);
    const user = await userRepo.findById(payload.userId);
    if (!user || !user.isActive) return next(new Error('Người dùng không hợp lệ'));

    socket.data.user = user;
    socket.data.isGuest = false;
    await userRepo.update(user.id, { isOnline: true, lastSeenAt: new Date() } as any);

    next();
  } catch {
    next(new Error('Token không hợp lệ'));
  }
}
