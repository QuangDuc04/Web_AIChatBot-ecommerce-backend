import { Socket } from 'socket.io';
import { UserRepository } from '../../repositories/user.repository';
import { ConversationParticipantRepository } from '../../repositories/conversationParticipant.repository';
import { NotificationRepository } from '../../repositories/notification.repository';
import { AdminNotificationRepository } from '../../repositories/adminNotification.repository';
import { UserRole } from '../../types/enums';

const userRepo = new UserRepository();
const participantRepo = new ConversationParticipantRepository();
const notifRepo = new NotificationRepository();
const adminNotifRepo = new AdminNotificationRepository();

export async function handleConnection(socket: Socket) {
  const user = socket.data.user;
  if (!user) return;

  // Join personal room
  socket.join(`user:${user.id}`);

  // Join conversation rooms
  const convIds = await participantRepo.getUserConversationIds(user.id);
  for (const cid of convIds) {
    socket.join(`conversation:${cid}`);
  }

  // Join admin room if staff/admin
  const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.STAFF;
  if (isAdmin) {
    socket.join('orders');
  }

  // Send initial unread count (admin vs customer)
  const unreadCount = isAdmin
    ? await adminNotifRepo.countUnread(user.id)
    : await notifRepo.countUnread(user.id);
  socket.emit('notification:count', { unreadCount });

  console.log(`Socket connected: ${user.email} (${socket.id})`);
}

export async function handleDisconnect(socket: Socket) {
  const user = socket.data.user;
  if (!user) return;

  await userRepo.update(user.id, { isOnline: false, lastSeenAt: new Date() } as any);
  console.log(`Socket disconnected: ${user.email}`);
}
