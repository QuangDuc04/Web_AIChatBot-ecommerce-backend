import { UserRole } from './enums';

export type ActorType = 'user' | 'customer';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole | 'customer';
  actorType: ActorType;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
