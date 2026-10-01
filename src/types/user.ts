export type UserRole = 'customer' | 'admin';

export type UserTier = 'Bronze' | 'Silver' | 'Gold' | 'VIP';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  credits: number; // Balance in THB
  tier: UserTier;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}
