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

export type DeletionRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface DeletionRequest {
  id: string;
  userId: string;
  email: string | null;
  displayName: string | null;
  credits: number;
  status: DeletionRequestStatus;
  userReason?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
}
