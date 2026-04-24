import { UserRole } from './enums';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatar: string;
  role: UserRole;
  isOnline: boolean;
  lastSeenAt: Date;
}
